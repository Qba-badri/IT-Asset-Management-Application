import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { Asset } from '../entities/asset.entity';
import { AssetHistory } from '../entities/asset-history.entity';
import { AssetPhoto } from '../entities/asset-photo.entity';
import { License } from '../entities/license.entity';
import { LicenseAssignment } from '../entities/license-assignment.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import {
  InventoryAudit,
  InventoryAuditDetail,
} from '../entities/inventory-audit.entity';

export const typeormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'IT Asset Management',
  entities: [
    User,
    PasswordResetToken,
    AuditLog,
    Role,
    Permission,
    Asset,
    AssetHistory,
    AssetPhoto,
    License,
    LicenseAssignment,
    InventoryItem,
    InventoryAudit,
    InventoryAuditDetail,
  ],
  synchronize: process.env.NODE_ENV !== 'production', // Disable auto-sync in production
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};
