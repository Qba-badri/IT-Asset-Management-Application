import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { InventoryCategory } from '../../entities/inventory-category.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { InventoryPurchase } from '../../entities/inventory-purchase.entity';
import { InventoryAssignment, InventoryAssignmentStatus, InventoryAssignmentTargetType } from '../../entities/inventory-assignment.entity';
import { InventoryReturn } from '../../entities/inventory-return.entity';
import { InventoryTransaction, InventoryTransactionType } from '../../entities/inventory-transaction.entity';
import { User } from '../../entities/user.entity';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';
import { CreateInventoryCategoryDto, CreateInventoryItemDto, CreateInventoryPurchaseDto, CreateInventoryAssignmentDto, CreateInventoryReturnDto, AdjustStockDto, DeleteAssignmentDto } from './dto/inventory-mgmt.dto';
import { assertActiveReference } from '../../common/validation/active-reference';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InventoryManagementService {
    constructor(
        @InjectRepository(InventoryCategory)
        private categoryRepo: Repository<InventoryCategory>,
        @InjectRepository(InventoryItem)
        private itemRepo: Repository<InventoryItem>,
        @InjectRepository(InventoryPurchase)
        private purchaseRepo: Repository<InventoryPurchase>,
        @InjectRepository(InventoryAssignment)
        private assignmentRepo: Repository<InventoryAssignment>,
        @InjectRepository(InventoryReturn)
        private returnRepo: Repository<InventoryReturn>,
        @InjectRepository(InventoryTransaction)
        private transactionRepo: Repository<InventoryTransaction>,
        @InjectRepository(AuditEvent)
        private auditEventRepo: Repository<AuditEvent>,
        private dataSource: DataSource,
        private readonly notificationsService: NotificationsService,
    ) { }

    // --- Low-stock alerting ---
    // Fired only on the threshold-crossing edge (previousStock at/above the
    // minimum, newStock below it) — never on every subsequent adjustment —
    // so a low-stock item doesn't spam an email per transaction. Called
    // after the DB transaction that changed stock has committed.
    private async maybeAlertLowStock(item: InventoryItem, previousStock: number): Promise<void> {
        const threshold = item.minStockLevel;
        if (previousStock >= threshold && item.availableStock < threshold) {
            await this.notificationsService.notifyLowStock({
                id: item.id,
                name: item.name,
                availableStock: item.availableStock,
                minStockLevel: item.minStockLevel,
            });
        }
    }

    // --- Categories ---
    async createCategory(dto: CreateInventoryCategoryDto) {
        const category = this.categoryRepo.create(dto);
        return this.categoryRepo.save(category);
    }

    async findAllCategories() {
        return this.categoryRepo.find({ relations: ['items'] });
    }

    async findOneCategory(id: number) {
        const category = await this.categoryRepo.findOne({
            where: { id },
            relations: ['items'],
        });
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return category;
    }

    async updateCategory(id: number, dto: CreateInventoryCategoryDto, actorId?: number) {
        const category = await this.findOneCategory(id);
        const statusChanging =
            dto.isActive !== undefined && dto.isActive !== category.isActive;
        const from = category.isActive;
        Object.assign(category, dto);

        if (!statusChanging) {
            return this.categoryRepo.save(category);
        }

        // A status change and its audit record commit atomically.
        return this.dataSource.transaction(async (manager) => {
            const saved = await manager.save(category);
            const audit = manager.getRepository(AuditEvent).create({
                action: AuditAction.UPDATE,
                entityType: 'InventoryCategory',
                entityId: id,
                actorId,
                metadata: { field: 'isActive', from, to: dto.isActive, name: category.name },
            });
            await manager.getRepository(AuditEvent).save(audit);
            return saved;
        });
    }

    async deleteCategory(id: number) {
        const category = await this.findOneCategory(id);

        // Check if category has any items — including soft-deleted ones,
        // which still reference the category in audit history
        const itemCount = await this.itemRepo.count({
            where: { categoryId: id },
            withDeleted: true,
        });

        if (itemCount > 0) {
            throw new BadRequestException(
                `Cannot delete category with ${itemCount} item${itemCount > 1 ? 's' : ''} (including previously deleted items kept for audit history). Please reassign the items first.`
            );
        }

        await this.categoryRepo.softRemove(category);
        return { message: 'Category deleted successfully' };
    }

    // --- Items ---
    async createItem(dto: CreateInventoryItemDto) {
        await assertActiveReference(this.categoryRepo, dto.categoryId, 'Inventory category');
        const item = this.itemRepo.create(dto);
        if (dto.packQuantity != null) {
            const unitsPerPack = dto.unitsPerPack ?? 1;
            item.totalStock = dto.packQuantity * unitsPerPack;
            item.availableStock = item.totalStock;
        }
        return this.itemRepo.save(item);
    }

    async findAllItems() {
        return this.itemRepo.find({ relations: ['category'] });
    }

    async findOneItem(id: number) {
        const item = await this.itemRepo.findOne({
            where: { id },
            relations: ['category', 'transactions', 'transactions.performedBy', 'assignments', 'assignments.user', 'purchases'],
        });
        if (!item) throw new NotFoundException('Inventory item not found');
        return item;
    }

    async updateItem(id: number, dto: CreateInventoryItemDto) {
        const item = await this.itemRepo.findOne({ where: { id } });
        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }
        // Retaining the current category is allowed even if it has since been
        // deactivated; switching to an inactive one is not.
        await assertActiveReference(this.categoryRepo, dto.categoryId, 'Inventory category', item.categoryId);

        // Note: totalStock/availableStock are normally driven by purchases, assignments and
        // returns. Editing packQuantity on the item form is the one direct override allowed —
        // it recomputes totalStock from packs and shifts availableStock by the same delta so
        // stock already checked out to users isn't affected.
        Object.assign(item, {
            name: dto.name,
            categoryId: dto.categoryId,
            isRefundable: dto.isRefundable,
            minStockLevel: dto.minStockLevel,
            unitsPerPack: dto.unitsPerPack,
        });

        if (dto.packQuantity != null) {
            const unitsPerPack = dto.unitsPerPack ?? item.unitsPerPack ?? 1;
            const newTotal = dto.packQuantity * unitsPerPack;
            const delta = newTotal - item.totalStock;
            item.totalStock = newTotal;
            item.availableStock = Math.max(0, item.availableStock + delta);
        }

        return this.itemRepo.save(item);
    }

    // --- Manual Stock Adjustment ---
    // Corrects stock counts directly (e.g. stock-take discrepancies, damage/loss write-offs)
    // outside the normal purchase/assignment/return flow. Only IN (increase) or OUT (decrease)
    // adjustments are accepted; every adjustment is logged as an immutable InventoryTransaction
    // (type ADJUSTMENT) and an AuditEvent for traceability.
    async adjustStock(dto: AdjustStockDto, userId: number) {
        if (dto.type !== InventoryTransactionType.IN && dto.type !== InventoryTransactionType.OUT) {
            throw new BadRequestException('Adjustment type must be IN (increase) or OUT (decrease)');
        }
        if (dto.quantity <= 0) {
            throw new BadRequestException('Adjustment quantity must be greater than zero');
        }

        let previousStock = 0;
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(InventoryItem, { where: { id: dto.itemId } });
            if (!item) throw new NotFoundException('Item not found');

            previousStock = item.availableStock;

            if (dto.type === InventoryTransactionType.OUT) {
                if (item.availableStock < dto.quantity) {
                    throw new BadRequestException(`Insufficient stock. Available: ${item.availableStock}`);
                }
                item.totalStock -= dto.quantity;
                item.availableStock -= dto.quantity;
            } else {
                item.totalStock += dto.quantity;
                item.availableStock += dto.quantity;
            }
            await manager.save(InventoryItem, item);

            const transaction = manager.create(InventoryTransaction, {
                itemId: item.id,
                type: InventoryTransactionType.ADJUSTMENT,
                quantity: dto.quantity,
                referenceType: 'manual_adjustment',
                performedById: userId,
                notes: dto.notes,
            });
            const savedTransaction = await manager.save(InventoryTransaction, transaction);

            const auditEvent = manager.create(AuditEvent, {
                action: AuditAction.ADJUST,
                entityType: 'inventory_item',
                entityId: item.id,
                actorId: userId,
                metadata: {
                    direction: dto.type,
                    quantity: dto.quantity,
                    previousStock,
                    newStock: item.availableStock,
                    notes: dto.notes,
                },
            });
            await manager.save(AuditEvent, auditEvent);

            return savedTransaction;
        }).then(async (savedTransaction) => {
            const freshItem = await this.itemRepo.findOne({ where: { id: dto.itemId } });
            if (freshItem) {
                await this.maybeAlertLowStock(freshItem, previousStock);
            }
            return savedTransaction;
        });
    }

    // --- Purchase Management ---
    async createPurchase(dto: CreateInventoryPurchaseDto, userId: number) {
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(InventoryItem, { where: { id: dto.itemId } });
            if (!item) throw new NotFoundException('Item not found');

            // Purchases entered in packs are converted to units server-side (never trust a client-computed total)
            const unitsPerPack = dto.packQuantity ? (dto.unitsPerPack ?? item.unitsPerPack ?? 1) : 1;
            const quantity = dto.packQuantity ? dto.packQuantity * unitsPerPack : dto.quantity;

            // 1. Create Purchase record
            const purchase = manager.create(InventoryPurchase, {
                ...dto,
                quantity,
                packQuantity: dto.packQuantity ?? null,
                unitsPerPack,
                totalCost: quantity * dto.unitCost,
            });
            const savedPurchase = await manager.save(InventoryPurchase, purchase);

            // 2. Update Stock
            item.totalStock += quantity;
            item.availableStock += quantity;
            await manager.save(InventoryItem, item);

            // 3. Log Transaction
            const transaction = manager.create(InventoryTransaction, {
                itemId: item.id,
                type: InventoryTransactionType.IN,
                quantity,
                referenceId: savedPurchase.id,
                referenceType: 'purchase',
                performedById: userId,
                notes: `Purchase from ${dto.vendorName}. Invoice: ${dto.invoiceNumber || 'N/A'}`,
            });
            await manager.save(InventoryTransaction, transaction);

            return savedPurchase;
        });
    }

    // --- Assignment Module ---
    async createAssignment(dto: CreateInventoryAssignmentDto, performerId: number) {
        let previousStock = 0;
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(InventoryItem, { where: { id: dto.itemId } });
            if (!item) throw new NotFoundException('Item not found');
            previousStock = item.availableStock;

            const targetType = dto.targetType || InventoryAssignmentTargetType.PERSON;
            let assigneeLabel: string;
            if (targetType === InventoryAssignmentTargetType.LOCATION) {
                if (!dto.location) throw new BadRequestException('Location is required for a LOCATION assignment');
                assigneeLabel = dto.location;
            } else {
                if (!dto.userId) throw new BadRequestException('User is required for a PERSON assignment');
                const assignee = await manager.findOne(User, { where: { id: dto.userId } });
                assigneeLabel = assignee ? `${assignee.firstName} ${assignee.lastName}` : `User #${dto.userId}`;
            }

            if (item.availableStock < dto.quantity) {
                throw new BadRequestException(`Insufficient stock. Available: ${item.availableStock}`);
            }

            // 1. Create Assignment
            const assignment = manager.create(InventoryAssignment, {
                ...dto,
                targetType,
                userId: targetType === InventoryAssignmentTargetType.PERSON ? dto.userId : undefined,
                location: targetType === InventoryAssignmentTargetType.LOCATION ? dto.location : undefined,
                status: InventoryAssignmentStatus.ASSIGNED,
            });
            const savedAssignment = await manager.save(InventoryAssignment, assignment);

            // 2. Update Stock
            item.availableStock -= dto.quantity;
            await manager.save(InventoryItem, item);

            // 3. Log Transaction
            const transaction = manager.create(InventoryTransaction, {
                itemId: item.id,
                type: InventoryTransactionType.OUT,
                quantity: dto.quantity,
                referenceId: savedAssignment.id,
                referenceType: 'assignment',
                performedById: performerId,
                notes: targetType === InventoryAssignmentTargetType.LOCATION
                    ? `Deployed to location: ${assigneeLabel}`
                    : `Assigned to ${assigneeLabel}`,
            });
            await manager.save(InventoryTransaction, transaction);

            return { savedAssignment, item, targetType };
        }).then(async ({ savedAssignment, item, targetType }) => {
            await this.maybeAlertLowStock(item, previousStock);
            if (targetType === InventoryAssignmentTargetType.PERSON && dto.userId) {
                await this.notificationsService.notifyAssignment({
                    assignedUserId: dto.userId,
                    entityType: 'inventory_item',
                    entityName: `${item.name} x${dto.quantity}`,
                    action: 'assigned',
                });
            }
            return savedAssignment;
        });
    }

    // --- Return Management ---
    async createReturn(dto: CreateInventoryReturnDto, approvedById: number) {
        return this.dataSource.transaction(async (manager) => {
            const assignment = await manager.findOne(InventoryAssignment, {
                where: { id: dto.assignmentId },
                relations: ['item'],
            });

            if (!assignment) throw new NotFoundException('Assignment not found');
            if (assignment.status !== InventoryAssignmentStatus.ASSIGNED) {
                throw new BadRequestException('Items already returned or assignment closed');
            }

            const item = assignment.item;
            if (!item.isRefundable) {
                throw new BadRequestException('This item is non-refundable and cannot be returned');
            }

            // 1. Create Return record
            const returnRecord = manager.create(InventoryReturn, {
                ...dto,
                itemId: item.id,
                approvedById,
            });
            const savedReturn = await manager.save(InventoryReturn, returnRecord);

            // 2. Update Assignment status
            assignment.status = InventoryAssignmentStatus.RETURNED;
            await manager.save(InventoryAssignment, assignment);

            // 3. Update Stock
            item.availableStock += assignment.quantity;
            await manager.save(InventoryItem, item);

            // 4. Log Transaction
            const transaction = manager.create(InventoryTransaction, {
                itemId: item.id,
                type: InventoryTransactionType.RETURN,
                quantity: assignment.quantity,
                referenceId: savedReturn.id,
                referenceType: 'return',
                performedById: approvedById,
                notes: `Return from assignment #${assignment.id}. Condition: ${dto.condition || 'N/A'}`,
            });
            await manager.save(InventoryTransaction, transaction);

            return { savedReturn, item, assignment };
        }).then(async ({ savedReturn, item, assignment }) => {
            await this.maybeAlertLowStock(item, item.availableStock - assignment.quantity);
            if (assignment.userId) {
                await this.notificationsService.notifyAssignment({
                    assignedUserId: assignment.userId,
                    entityType: 'inventory_item',
                    entityName: `${item.name} x${assignment.quantity}`,
                    action: 'unassigned',
                });
            }
            return savedReturn;
        });
    }

    async returnAssignment(assignmentId: number, dto: { condition?: string; remarks?: string }, approvedById: number) {
        // Use the existing createReturn method
        return this.createReturn({
            assignmentId,
            condition: dto.condition || '',
            remarks: dto.remarks || ''
        }, approvedById);
    }

    // --- Correction: mistaken assignment on a non-refundable item ---
    // Non-refundable items have no physical "return" flow (issued items aren't taken back), so a
    // wrong assignment (e.g. wrong user, wrong quantity) previously had no way to be corrected.
    // This restores the stock and voids the assignment record (soft-deleted, not hard-deleted, so
    // the correction itself stays auditable), logged as an InventoryTransaction + AuditEvent.
    async deleteMistakenAssignment(assignmentId: number, dto: DeleteAssignmentDto, performedById: number) {
        return this.dataSource.transaction(async (manager) => {
            const assignment = await manager.findOne(InventoryAssignment, {
                where: { id: assignmentId },
                relations: ['item'],
            });

            if (!assignment) throw new NotFoundException('Assignment not found');
            if (assignment.status !== InventoryAssignmentStatus.ASSIGNED) {
                throw new BadRequestException('Only active assignments can be corrected');
            }

            const item = assignment.item;
            if (item.isRefundable) {
                throw new BadRequestException('Refundable items must be corrected via the Return flow, not deletion');
            }

            // 1. Restore stock
            item.availableStock += assignment.quantity;
            await manager.save(InventoryItem, item);

            // 2. Void the assignment (soft delete keeps the record for audit, status marks it closed)
            assignment.status = InventoryAssignmentStatus.CLOSED;
            await manager.save(InventoryAssignment, assignment);
            await manager.softDelete(InventoryAssignment, assignment.id);

            // 3. Log Transaction
            const transaction = manager.create(InventoryTransaction, {
                itemId: item.id,
                type: InventoryTransactionType.ADJUSTMENT,
                quantity: assignment.quantity,
                referenceId: assignment.id,
                referenceType: 'assignment_correction',
                performedById,
                notes: `Removed mistaken assignment #${assignment.id}. Reason: ${dto.reason}`,
            });
            await manager.save(InventoryTransaction, transaction);

            // 4. Audit trail
            const auditEvent = manager.create(AuditEvent, {
                action: AuditAction.DELETE,
                entityType: 'inventory_assignment',
                entityId: assignment.id,
                actorId: performedById,
                metadata: {
                    itemId: item.id,
                    quantity: assignment.quantity,
                    reason: dto.reason,
                },
            });
            await manager.save(AuditEvent, auditEvent);

            return { result: { message: 'Assignment corrected and stock restored successfully' }, item, assignment };
        }).then(async ({ result, item, assignment }) => {
            await this.maybeAlertLowStock(item, item.availableStock - assignment.quantity);
            if (assignment.userId) {
                await this.notificationsService.notifyAssignment({
                    assignedUserId: assignment.userId,
                    entityType: 'inventory_item',
                    entityName: `${item.name} x${assignment.quantity}`,
                    action: 'unassigned',
                });
            }
            return result;
        });
    }

    // --- History & Reports ---
    async getStockHistory(itemId?: number) {
        const where = itemId ? { itemId } : {};
        return this.transactionRepo.find({
            where,
            relations: ['item', 'performedBy'],
            order: { transactionDate: 'DESC' },
        });
    }

    async getPurchases() {
        return this.purchaseRepo.find({
            relations: ['item'],
            order: { purchaseDate: 'DESC' },
        });
    }

    async getAssignments(userId?: number) {
        const where = userId ? { userId } : {};
        return this.assignmentRepo.find({
            where,
            relations: ['item', 'user'],
            order: { assignmentDate: 'DESC' },
        });
    }

    // --- Dashboard Widgets ---
    async getDashboardStats() {
        const totalItems = await this.itemRepo.count();
        const items = await this.itemRepo.find();

        const totalStock = items.reduce((sum, item) => sum + item.totalStock, 0);
        const lowStockAlert = items.filter(item => item.availableStock <= item.minStockLevel).length;

        const assignedItems = await this.assignmentRepo.count({
            where: { status: InventoryAssignmentStatus.ASSIGNED }
        });

        const pendingReturns = await this.assignmentRepo.count({
            where: {
                status: InventoryAssignmentStatus.ASSIGNED,
                item: { isRefundable: true }
            }
        });

        const refundableItemsCount = await this.itemRepo.count({
            where: { isRefundable: true }
        });

        return {
            totalItems,
            totalStock,
            lowStockAlert,
            assignedItems,
            pendingReturns,
            refundableItemsCount,
        };
    }

    // --- Delete Item ---
    async deleteItem(id: number) {
        const item = await this.itemRepo.findOne({
            where: { id },
            relations: ['assignments', 'transactions'],
        });

        if (!item) {
            throw new NotFoundException('Inventory item not found');
        }

        if (item.isRefundable) {
            const activeAssignments = await this.assignmentRepo.count({
                where: {
                    itemId: id,
                    status: InventoryAssignmentStatus.ASSIGNED
                }
            });

            if (activeAssignments > 0) {
                throw new BadRequestException(
                    `Cannot delete refundable item with active assignments. Please return all assigned items first. (${activeAssignments} active assignment${activeAssignments > 1 ? 's' : ''})`
                );
            }
        }

        // Items that were ever assigned appear in audit reports — they must be
        // kept, not deleted, to keep audit trails intact. Includes soft-deleted
        // (corrected) assignments.
        const assignmentHistoryCount = await this.assignmentRepo.count({
            where: { itemId: id },
            withDeleted: true,
        });
        if (assignmentHistoryCount > 0) {
            throw new BadRequestException(
                'This item has assignment history and appears in audit reports. It cannot be deleted.'
            );
        }

        // Soft delete the item
        await this.itemRepo.softDelete(id);

        return { message: 'Item deleted successfully' };
    }
}
