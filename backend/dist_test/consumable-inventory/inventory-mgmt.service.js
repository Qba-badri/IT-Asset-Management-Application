"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryManagementService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_category_entity_1 = require("../entities/inventory-category.entity");
const inventory_item_entity_1 = require("../entities/inventory-item.entity");
const inventory_purchase_entity_1 = require("../entities/inventory-purchase.entity");
const inventory_assignment_entity_1 = require("../entities/inventory-assignment.entity");
const inventory_return_entity_1 = require("../entities/inventory-return.entity");
const inventory_transaction_entity_1 = require("../entities/inventory-transaction.entity");
let InventoryManagementService = class InventoryManagementService {
    constructor(categoryRepo, itemRepo, purchaseRepo, assignmentRepo, returnRepo, transactionRepo, dataSource) {
        this.categoryRepo = categoryRepo;
        this.itemRepo = itemRepo;
        this.purchaseRepo = purchaseRepo;
        this.assignmentRepo = assignmentRepo;
        this.returnRepo = returnRepo;
        this.transactionRepo = transactionRepo;
        this.dataSource = dataSource;
    }
    async createCategory(dto) {
        const category = this.categoryRepo.create(dto);
        return this.categoryRepo.save(category);
    }
    async findAllCategories() {
        return this.categoryRepo.find({ relations: ['items'] });
    }
    async findOneCategory(id) {
        const category = await this.categoryRepo.findOne({
            where: { id },
            relations: ['items'],
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async updateCategory(id, dto) {
        const category = await this.findOneCategory(id);
        Object.assign(category, dto);
        return this.categoryRepo.save(category);
    }
    async deleteCategory(id) {
        const category = await this.findOneCategory(id);
        const itemCount = await this.itemRepo.count({
            where: { categoryId: id }
        });
        if (itemCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete category with ${itemCount} item${itemCount > 1 ? 's' : ''}. Please reassign or delete the items first.`);
        }
        await this.categoryRepo.remove(category);
        return { message: 'Category deleted successfully' };
    }
    async createItem(dto) {
        const item = this.itemRepo.create(dto);
        return this.itemRepo.save(item);
    }
    async findAllItems() {
        return this.itemRepo.find({ relations: ['category'] });
    }
    async findOneItem(id) {
        const item = await this.itemRepo.findOne({
            where: { id },
            relations: ['category', 'transactions', 'transactions.performedBy', 'assignments', 'assignments.user', 'purchases'],
        });
        if (!item)
            throw new common_1.NotFoundException('Inventory item not found');
        return item;
    }
    async updateItem(id, dto) {
        const item = await this.itemRepo.findOne({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        Object.assign(item, {
            name: dto.name,
            categoryId: dto.categoryId,
            isRefundable: dto.isRefundable,
            minStockLevel: dto.minStockLevel,
        });
        return this.itemRepo.save(item);
    }
    async createPurchase(dto, userId) {
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(inventory_item_entity_1.InventoryItem, { where: { id: dto.itemId } });
            if (!item)
                throw new common_1.NotFoundException('Item not found');
            const purchase = manager.create(inventory_purchase_entity_1.InventoryPurchase, {
                ...dto,
                totalCost: dto.quantity * dto.unitCost,
            });
            const savedPurchase = await manager.save(inventory_purchase_entity_1.InventoryPurchase, purchase);
            item.totalStock += dto.quantity;
            item.availableStock += dto.quantity;
            await manager.save(inventory_item_entity_1.InventoryItem, item);
            const transaction = manager.create(inventory_transaction_entity_1.InventoryTransaction, {
                itemId: item.id,
                type: inventory_transaction_entity_1.InventoryTransactionType.IN,
                quantity: dto.quantity,
                referenceId: savedPurchase.id,
                referenceType: 'purchase',
                performedById: userId,
                notes: `Purchase from ${dto.vendorName}. Invoice: ${dto.invoiceNumber || 'N/A'}`,
            });
            await manager.save(inventory_transaction_entity_1.InventoryTransaction, transaction);
            return savedPurchase;
        });
    }
    async createAssignment(dto, performerId) {
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(inventory_item_entity_1.InventoryItem, { where: { id: dto.itemId } });
            if (!item)
                throw new common_1.NotFoundException('Item not found');
            if (item.availableStock < dto.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock. Available: ${item.availableStock}`);
            }
            const assignment = manager.create(inventory_assignment_entity_1.InventoryAssignment, {
                ...dto,
                status: inventory_assignment_entity_1.InventoryAssignmentStatus.ASSIGNED,
            });
            const savedAssignment = await manager.save(inventory_assignment_entity_1.InventoryAssignment, assignment);
            item.availableStock -= dto.quantity;
            await manager.save(inventory_item_entity_1.InventoryItem, item);
            const transaction = manager.create(inventory_transaction_entity_1.InventoryTransaction, {
                itemId: item.id,
                type: inventory_transaction_entity_1.InventoryTransactionType.OUT,
                quantity: dto.quantity,
                referenceId: savedAssignment.id,
                referenceType: 'assignment',
                performedById: performerId,
                notes: `Assigned to UID: ${dto.userId}`,
            });
            await manager.save(inventory_transaction_entity_1.InventoryTransaction, transaction);
            return savedAssignment;
        });
    }
    async createReturn(dto, approvedById) {
        return this.dataSource.transaction(async (manager) => {
            const assignment = await manager.findOne(inventory_assignment_entity_1.InventoryAssignment, {
                where: { id: dto.assignmentId },
                relations: ['item'],
            });
            if (!assignment)
                throw new common_1.NotFoundException('Assignment not found');
            if (assignment.status !== inventory_assignment_entity_1.InventoryAssignmentStatus.ASSIGNED) {
                throw new common_1.BadRequestException('Items already returned or assignment closed');
            }
            const item = assignment.item;
            if (!item.isRefundable) {
                throw new common_1.BadRequestException('This item is non-refundable and cannot be returned');
            }
            const returnRecord = manager.create(inventory_return_entity_1.InventoryReturn, {
                ...dto,
                itemId: item.id,
                approvedById,
            });
            const savedReturn = await manager.save(inventory_return_entity_1.InventoryReturn, returnRecord);
            assignment.status = inventory_assignment_entity_1.InventoryAssignmentStatus.RETURNED;
            await manager.save(inventory_assignment_entity_1.InventoryAssignment, assignment);
            item.availableStock += assignment.quantity;
            await manager.save(inventory_item_entity_1.InventoryItem, item);
            const transaction = manager.create(inventory_transaction_entity_1.InventoryTransaction, {
                itemId: item.id,
                type: inventory_transaction_entity_1.InventoryTransactionType.RETURN,
                quantity: assignment.quantity,
                referenceId: savedReturn.id,
                referenceType: 'return',
                performedById: approvedById,
                notes: `Return from assignment #${assignment.id}. Condition: ${dto.condition || 'N/A'}`,
            });
            await manager.save(inventory_transaction_entity_1.InventoryTransaction, transaction);
            return savedReturn;
        });
    }
    async returnAssignment(assignmentId, dto, approvedById) {
        return this.createReturn({
            assignmentId,
            condition: dto.condition || '',
            remarks: dto.remarks || ''
        }, approvedById);
    }
    async getStockHistory(itemId) {
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
    async getAssignments(userId) {
        const where = userId ? { userId } : {};
        return this.assignmentRepo.find({
            where,
            relations: ['item', 'user'],
            order: { assignmentDate: 'DESC' },
        });
    }
    async getDashboardStats() {
        const totalItems = await this.itemRepo.count();
        const items = await this.itemRepo.find();
        const totalStock = items.reduce((sum, item) => sum + item.totalStock, 0);
        const lowStockAlert = items.filter(item => item.availableStock <= item.minStockLevel).length;
        const assignedItems = await this.assignmentRepo.count({
            where: { status: inventory_assignment_entity_1.InventoryAssignmentStatus.ASSIGNED }
        });
        const pendingReturns = await this.assignmentRepo.count({
            where: {
                status: inventory_assignment_entity_1.InventoryAssignmentStatus.ASSIGNED,
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
    async deleteItem(id) {
        const item = await this.itemRepo.findOne({
            where: { id },
            relations: ['assignments', 'transactions'],
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        if (item.isRefundable) {
            const activeAssignments = await this.assignmentRepo.count({
                where: {
                    itemId: id,
                    status: inventory_assignment_entity_1.InventoryAssignmentStatus.ASSIGNED
                }
            });
            if (activeAssignments > 0) {
                throw new common_1.BadRequestException(`Cannot delete refundable item with active assignments. Please return all assigned items first. (${activeAssignments} active assignment${activeAssignments > 1 ? 's' : ''})`);
            }
        }
        await this.itemRepo.softDelete(id);
        return { message: 'Item deleted successfully' };
    }
};
exports.InventoryManagementService = InventoryManagementService;
exports.InventoryManagementService = InventoryManagementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_category_entity_1.InventoryCategory)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_purchase_entity_1.InventoryPurchase)),
    __param(3, (0, typeorm_1.InjectRepository)(inventory_assignment_entity_1.InventoryAssignment)),
    __param(4, (0, typeorm_1.InjectRepository)(inventory_return_entity_1.InventoryReturn)),
    __param(5, (0, typeorm_1.InjectRepository)(inventory_transaction_entity_1.InventoryTransaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], InventoryManagementService);
//# sourceMappingURL=inventory-mgmt.service.js.map