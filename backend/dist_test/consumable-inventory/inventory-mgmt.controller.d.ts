import { InventoryManagementService } from './inventory-mgmt.service';
import { CreateInventoryCategoryDto, CreateInventoryItemDto, CreateInventoryPurchaseDto, CreateInventoryAssignmentDto, CreateInventoryReturnDto } from './dto/inventory-mgmt.dto';
export declare class InventoryManagementController {
    private readonly service;
    constructor(service: InventoryManagementService);
    getDashboard(): Promise<{
        totalItems: number;
        totalStock: number;
        lowStockAlert: number;
        assignedItems: number;
        pendingReturns: number;
        refundableItemsCount: number;
    }>;
    createCategory(dto: CreateInventoryCategoryDto): Promise<import("../entities/inventory-category.entity").InventoryCategory>;
    getCategories(): Promise<import("../entities/inventory-category.entity").InventoryCategory[]>;
    getCategory(id: number): Promise<import("../entities/inventory-category.entity").InventoryCategory>;
    updateCategory(id: number, dto: CreateInventoryCategoryDto): Promise<import("../entities/inventory-category.entity").InventoryCategory>;
    deleteCategory(id: number): Promise<{
        message: string;
    }>;
    createItem(dto: CreateInventoryItemDto): Promise<import("../entities/inventory-item.entity").InventoryItem>;
    getItems(): Promise<import("../entities/inventory-item.entity").InventoryItem[]>;
    getItem(id: number): Promise<import("../entities/inventory-item.entity").InventoryItem>;
    updateItem(id: number, dto: CreateInventoryItemDto): Promise<import("../entities/inventory-item.entity").InventoryItem>;
    deleteItem(id: number): Promise<{
        message: string;
    }>;
    createPurchase(dto: CreateInventoryPurchaseDto, req: any): Promise<import("../entities/inventory-purchase.entity").InventoryPurchase>;
    getPurchases(): Promise<import("../entities/inventory-purchase.entity").InventoryPurchase[]>;
    createAssignment(dto: CreateInventoryAssignmentDto, req: any): Promise<import("../entities/inventory-assignment.entity").InventoryAssignment>;
    getAssignments(userId?: string, req?: any): Promise<import("../entities/inventory-assignment.entity").InventoryAssignment[]>;
    returnAssignment(id: number, dto: {
        condition?: string;
        remarks?: string;
    }, req: any): Promise<import("../entities/inventory-return.entity").InventoryReturn>;
    createReturn(dto: CreateInventoryReturnDto, req: any): Promise<import("../entities/inventory-return.entity").InventoryReturn>;
    getTransactions(itemId?: string): Promise<import("../entities/inventory-transaction.entity").InventoryTransaction[]>;
}
