import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryManagementController } from './inventory-mgmt.controller';
import { InventoryManagementService } from './inventory-mgmt.service';
import { InventoryCategory } from '../../entities/inventory-category.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { InventoryPurchase } from '../../entities/inventory-purchase.entity';
import { InventoryAssignment } from '../../entities/inventory-assignment.entity';
import { InventoryReturn } from '../../entities/inventory-return.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { AuditEvent } from '../../entities/audit-event.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            InventoryCategory,
            InventoryItem,
            InventoryPurchase,
            InventoryAssignment,
            InventoryReturn,
            InventoryTransaction,
            AuditEvent,
        ]),
        AuthModule,
    ],
    controllers: [InventoryManagementController],
    providers: [InventoryManagementService],
    exports: [InventoryManagementService],
})
export class InventoryManagementModule { }
