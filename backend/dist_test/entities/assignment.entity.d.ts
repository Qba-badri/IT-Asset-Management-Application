import { CatalogItem } from './catalog-item.entity';
import { AssetUnit } from './asset-unit.entity';
import { ReturnTransaction } from './return-transaction.entity';
import { Location } from './location.entity';
import { Department } from './department.entity';
import { User } from './user.entity';
export declare enum AssignmentStatus {
    ACTIVE = "active",
    RETURNED = "returned",
    PARTIALLY_RETURNED = "partially_returned",
    OVERDUE = "overdue",
    WRITTEN_OFF = "written_off"
}
export declare class Assignment {
    id: number;
    catalogItem: CatalogItem;
    catalogItemId: number;
    assetUnit: AssetUnit;
    assetUnitId: number;
    assignee: User;
    assigneeId: number;
    assignedBy: User;
    assignedById: number;
    issuedFromLocation: Location;
    locationId: number;
    department: Department;
    departmentId: number;
    quantity: number;
    returnedQuantity: number;
    dueDate: Date;
    status: AssignmentStatus;
    notes: string;
    returnTransactions: ReturnTransaction[];
    createdAt: Date;
    updatedAt: Date;
}
