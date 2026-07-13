import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AssetHistory, AssetAction } from '../../entities/asset-history.entity';
import { LicenseAssignment } from '../../entities/license-assignment.entity';
import { InventoryAssignment } from '../../entities/inventory-assignment.entity';

export interface RecentAssetAssignmentRow {
  id: number;
  assetName: string;
  assetTag: string;
  assignedTo: string;
  assignedDate: Date;
  status: 'deployed' | 'returned';
}

export interface RecentLicenseAssignmentRow {
  id: number;
  licenseName: string;
  assignedTo: string;
  expiryDate: Date | null;
  status: 'active' | 'expiring_soon' | 'expired';
}

export interface RecentInventoryAssignmentRow {
  id: number;
  itemName: string;
  assignedTo: string;
  quantity: number;
  assignedDate: Date;
  status: string;
}

const DEFAULT_LIMIT = 10;

@Injectable()
export class DashboardWidgetsService {
  constructor(
    @InjectRepository(AssetHistory)
    private readonly assetHistoryRepo: Repository<AssetHistory>,
    @InjectRepository(LicenseAssignment)
    private readonly licenseAssignmentRepo: Repository<LicenseAssignment>,
    @InjectRepository(InventoryAssignment)
    private readonly inventoryAssignmentRepo: Repository<InventoryAssignment>,
  ) {}

  async getRecentAssetAssignments(limit = DEFAULT_LIMIT): Promise<RecentAssetAssignmentRow[]> {
    const rows = await this.assetHistoryRepo.find({
      where: { action: In([AssetAction.CHECKOUT, AssetAction.CHECKIN]) },
      relations: ['asset', 'assignedTo'],
      order: { actionDate: 'DESC' },
      take: limit,
    });

    return rows.map((r) => ({
      id: r.id,
      assetName: r.asset?.name || 'Unknown Asset',
      assetTag: r.asset?.assetTag || '',
      assignedTo: r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : 'Unassigned',
      assignedDate: r.actionDate,
      status: r.action === AssetAction.CHECKIN ? 'returned' : 'deployed',
    }));
  }

  async getRecentLicenseAssignments(limit = DEFAULT_LIMIT): Promise<RecentLicenseAssignmentRow[]> {
    const rows = await this.licenseAssignmentRepo.find({
      relations: ['license', 'user'],
      order: { assignedAt: 'DESC' },
      take: limit,
    });

    const now = Date.now();
    return rows.map((r) => {
      const expiryDate = r.license?.expiryDate || null;
      let status: RecentLicenseAssignmentRow['status'] = 'active';
      if (expiryDate) {
        const daysLeft = Math.ceil((new Date(expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) status = 'expired';
        else if (daysLeft <= 30) status = 'expiring_soon';
      }
      return {
        id: r.id,
        licenseName: r.license?.planName || r.license?.softwareName || 'Unknown License',
        assignedTo: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unassigned',
        expiryDate,
        status,
      };
    });
  }

  async getRecentInventoryAssignments(limit = DEFAULT_LIMIT): Promise<RecentInventoryAssignmentRow[]> {
    const rows = await this.inventoryAssignmentRepo.find({
      relations: ['item', 'user'],
      order: { assignmentDate: 'DESC' },
      take: limit,
    });

    return rows.map((r) => ({
      id: r.id,
      itemName: r.item?.name || 'Unknown Item',
      assignedTo: r.targetType === 'LOCATION' ? (r.location || 'Unknown Location') : (r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unassigned'),
      quantity: r.quantity,
      assignedDate: r.assignmentDate,
      status: r.status,
    }));
  }
}
