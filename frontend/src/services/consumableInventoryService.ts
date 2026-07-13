import apiClient from "./apiClient";

export interface InventoryCategory {
    id: number;
    name: string;
    description: string;
    items?: InventoryItem[];
}

export interface InventoryItem {
    id: number;
    name: string;
    categoryId: number;
    category?: InventoryCategory;
    isRefundable: boolean;
    totalStock: number;
    availableStock: number;
    minStockLevel: number;
    unitsPerPack: number;
    status: string;
    assignments?: InventoryAssignment[];
    purchases?: InventoryPurchase[];
    createdAt?: string;
    updatedAt?: string;
}

export interface InventoryPurchase {
    id: number;
    vendorName: string;
    invoiceNumber: string;
    purchaseDate: string;
    itemId: number;
    item?: InventoryItem;
    quantity: number;
    packQuantity?: number | null;
    unitsPerPack?: number;
    unitCost: number;
    totalCost: number;
    remarks: string;
    currency?: string;
    invoiceAttachment?: string;
}

export interface InventoryAssignment {
    id: number;
    userId: number;
    user?: { id: number; firstName: string; lastName: string; email: string };
    department?: string;
    itemId: number;
    item?: InventoryItem;
    quantity: number;
    assignmentDate: string;
    expectedReturnDate?: string;
    status: 'assigned' | 'returned' | 'closed';
}

export interface InventoryTransaction {
    id: number;
    itemId: number;
    item?: InventoryItem;
    type: 'IN' | 'OUT' | 'RETURN' | 'ADJUSTMENT';
    quantity: number;
    referenceId?: number;
    referenceType?: string;
    transactionDate: string;
    performedBy?: any;
    notes?: string;
}

export interface DashboardStats {
    totalItems: number;
    totalStock: number;
    lowStockAlert: number;
    assignedItems: number;
    pendingReturns: number;
    refundableItemsCount: number;
}

export const inventoryService = {
    // Categories
    getCategories: async () => {
        const response = await apiClient.get<InventoryCategory[]>("/api/inventory-management/categories");
        return response.data;
    },
    createCategory: async (data: any) => {
        const response = await apiClient.post<InventoryCategory>("/api/inventory-management/categories", data);
        return response.data;
    },
    getCategory: async (id: number) => {
        const response = await apiClient.get<InventoryCategory>(`/api/inventory-management/categories/${id}`);
        return response.data;
    },
    updateCategory: async (id: number, data: any) => {
        const response = await apiClient.put<InventoryCategory>(`/api/inventory-management/categories/${id}`, data);
        return response.data;
    },
    deleteCategory: async (id: number) => {
        const response = await apiClient.delete(`/api/inventory-management/categories/${id}`);
        return response.data;
    },

    // Items
    getItems: async () => {
        const response = await apiClient.get<InventoryItem[]>("/api/inventory-management/items");
        return response.data;
    },
    getItem: async (id: number) => {
        const response = await apiClient.get<InventoryItem>(`/api/inventory-management/items/${id}`);
        return response.data;
    },
    createItem: async (data: any) => {
        const response = await apiClient.post<InventoryItem>("/api/inventory-management/items", data);
        return response.data;
    },
    updateItem: async (id: number, data: any) => {
        const response = await apiClient.put<InventoryItem>(`/api/inventory-management/items/${id}`, data);
        return response.data;
    },
    deleteItem: async (id: number) => {
        const response = await apiClient.delete(`/api/inventory-management/items/${id}`);
        return response.data;
    },

    // Purchases
    getPurchases: async () => {
        const response = await apiClient.get<InventoryPurchase[]>("/api/inventory-management/purchases");
        return response.data;
    },
    createPurchase: async (data: any) => {
        const response = await apiClient.post<InventoryPurchase>("/api/inventory-management/purchases", data);
        return response.data;
    },

    // Assignments
    getAssignments: async (userId?: number) => {
        const response = await apiClient.get<InventoryAssignment[]>("/api/inventory-management/assignments", {
            params: { userId },
        });
        return response.data;
    },
    createAssignment: async (data: any) => {
        const response = await apiClient.post<InventoryAssignment>("/api/inventory-management/assignments", data);
        return response.data;
    },

    returnItem: async (assignmentId: number, data: { condition?: string; remarks?: string }) => {
        const response = await apiClient.post(`/api/inventory-management/assignments/${assignmentId}/return`, data);
        return response.data;
    },

    // Returns
    createReturn: async (data: any) => {
        const response = await apiClient.post("/api/inventory-management/returns", data);
        return response.data;
    },

    // Transactions
    getTransactions: async (itemId?: number) => {
        const response = await apiClient.get<InventoryTransaction[]>("/api/inventory-management/transactions", {
            params: { itemId },
        });
        return response.data;
    },

    // Dashboard
    getDashboardStats: async () => {
        const response = await apiClient.get<DashboardStats>("/api/inventory-management/dashboard");
        return response.data;
    },
};
