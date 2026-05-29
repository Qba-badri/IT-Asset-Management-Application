import { Repository, DataSource } from 'typeorm';
import { InventoryCategory } from '../entities/inventory-category.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryPurchase } from '../entities/inventory-purchase.entity';
import { InventoryAssignment } from '../entities/inventory-assignment.entity';
import { InventoryReturn } from '../entities/inventory-return.entity';
import { InventoryTransaction } from '../entities/inventory-transaction.entity';
import { CreateInventoryCategoryDto, CreateInventoryItemDto, CreateInventoryPurchaseDto, CreateInventoryAssignmentDto, CreateInventoryReturnDto } from './dto/inventory-mgmt.dto';
export declare class InventoryManagementService {
    private categoryRepo;
    private itemRepo;
    private purchaseRepo;
    private assignmentRepo;
    private returnRepo;
    private transactionRepo;
    private dataSource;
    constructor(categoryRepo: Repository<InventoryCategory>, itemRepo: Repository<InventoryItem>, purchaseRepo: Repository<InventoryPurchase>, assignmentRepo: Repository<InventoryAssignment>, returnRepo: Repository<InventoryReturn>, transactionRepo: Repository<InventoryTransaction>, dataSource: DataSource);
    createCategory(dto: CreateInventoryCategoryDto): Promise<InventoryCategory>;
    findAllCategories(): Promise<InventoryCategory[]>;
    findOneCategory(id: number): Promise<InventoryCategory>;
    updateCategory(id: number, dto: CreateInventoryCategoryDto): Promise<InventoryCategory>;
    deleteCategory(id: number): Promise<{
        message: string;
    }>;
    createItem(dto: CreateInventoryItemDto): Promise<InventoryItem>;
    findAllItems(): Promise<InventoryItem[]>;
    findOneItem(id: number): Promise<InventoryItem>;
    updateItem(id: number, dto: CreateInventoryItemDto): Promise<InventoryItem>;
    createPurchase(dto: CreateInventoryPurchaseDto, userId: number): Promise<InventoryPurchase>;
    createAssignment(dto: CreateInventoryAssignmentDto, performerId: number): Promise<InventoryAssignment>;
    createReturn(dto: CreateInventoryReturnDto, approvedById: number): Promise<InventoryReturn>;
    returnAssignment(assignmentId: number, dto: {
        condition?: string;
        remarks?: string;
    }, approvedById: number): Promise<InventoryReturn>;
    getStockHistory(itemId?: number): Promise<InventoryTransaction[]>;
    getPurchases(): Promise<InventoryPurchase[]>;
    getAssignments(userId?: number): Promise<InventoryAssignment[]>;
    getDashboardStats(): Promise<{
        totalItems: number;
        totalStock: number;
        lowStockAlert: number;
        assignedItems: number;
        pendingReturns: number;
        refundableItemsCount: number;
    }>;
    deleteItem(id: number): Promise<{
        message: string;
    }>;
}
