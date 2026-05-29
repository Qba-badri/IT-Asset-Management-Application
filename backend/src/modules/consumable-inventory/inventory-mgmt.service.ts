import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { InventoryCategory } from '../../entities/inventory-category.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { InventoryPurchase } from '../../entities/inventory-purchase.entity';
import { InventoryAssignment, InventoryAssignmentStatus } from '../../entities/inventory-assignment.entity';
import { InventoryReturn } from '../../entities/inventory-return.entity';
import { InventoryTransaction, InventoryTransactionType } from '../../entities/inventory-transaction.entity';
import { User } from '../../entities/user.entity';
import { CreateInventoryCategoryDto, CreateInventoryItemDto, CreateInventoryPurchaseDto, CreateInventoryAssignmentDto, CreateInventoryReturnDto, AdjustStockDto } from './dto/inventory-mgmt.dto';

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
        private dataSource: DataSource,
    ) { }

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

    async updateCategory(id: number, dto: CreateInventoryCategoryDto) {
        const category = await this.findOneCategory(id);
        Object.assign(category, dto);
        return this.categoryRepo.save(category);
    }

    async deleteCategory(id: number) {
        const category = await this.findOneCategory(id);

        // Check if category has any items
        const itemCount = await this.itemRepo.count({
            where: { categoryId: id }
        });

        if (itemCount > 0) {
            throw new BadRequestException(
                `Cannot delete category with ${itemCount} item${itemCount > 1 ? 's' : ''}. Please reassign or delete the items first.`
            );
        }

        await this.categoryRepo.remove(category);
        return { message: 'Category deleted successfully' };
    }

    // --- Items ---
    async createItem(dto: CreateInventoryItemDto) {
        const item = this.itemRepo.create(dto);
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

        // Update only the fields that can be changed
        // Note: totalStock and availableStock should not be updated directly
        // They should be updated through purchases, assignments, and returns
        Object.assign(item, {
            name: dto.name,
            categoryId: dto.categoryId,
            isRefundable: dto.isRefundable,
            minStockLevel: dto.minStockLevel,
        });

        return this.itemRepo.save(item);
    }

    // --- Purchase Management ---
    async createPurchase(dto: CreateInventoryPurchaseDto, userId: number) {
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(InventoryItem, { where: { id: dto.itemId } });
            if (!item) throw new NotFoundException('Item not found');

            // 1. Create Purchase record
            const purchase = manager.create(InventoryPurchase, {
                ...dto,
                totalCost: dto.quantity * dto.unitCost,
            });
            const savedPurchase = await manager.save(InventoryPurchase, purchase);

            // 2. Update Stock
            item.totalStock += dto.quantity;
            item.availableStock += dto.quantity;
            await manager.save(InventoryItem, item);

            // 3. Log Transaction
            const transaction = manager.create(InventoryTransaction, {
                itemId: item.id,
                type: InventoryTransactionType.IN,
                quantity: dto.quantity,
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
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(InventoryItem, { where: { id: dto.itemId } });
            if (!item) throw new NotFoundException('Item not found');

            if (item.availableStock < dto.quantity) {
                throw new BadRequestException(`Insufficient stock. Available: ${item.availableStock}`);
            }

            // 1. Create Assignment
            const assignment = manager.create(InventoryAssignment, {
                ...dto,
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
                notes: `Assigned to UID: ${dto.userId}`,
            });
            await manager.save(InventoryTransaction, transaction);

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

        // Only check for active assignments if the item is refundable (returnable)
        // Non-refundable items can be deleted even if they have assignments
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

        // Soft delete the item
        await this.itemRepo.softDelete(id);

        return { message: 'Item deleted successfully' };
    }
}
