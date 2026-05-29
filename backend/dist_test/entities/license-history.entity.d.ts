import { License } from './license.entity';
import { User } from './user.entity';
export declare enum LicenseAction {
    CREATED = "created",
    UPDATED = "updated",
    ASSIGNED = "assigned",
    UNASSIGNED = "unassigned",
    RENEWED = "renewed",
    AUDITED = "audited",
    SEAT_ADJUSTMENT = "seat_adjustment"
}
export declare class LicenseHistory {
    id: number;
    licenseId: number;
    license: License;
    action: LicenseAction;
    performedById: number;
    performedBy: User;
    assignedToId: number;
    assignedTo: User;
    notes: string;
    actionDate: Date;
}
