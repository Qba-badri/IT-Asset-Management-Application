import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Like } from 'typeorm';
import { Asset, AssetStatus, AssetCondition } from '../../entities/asset.entity';
import { AssetHistory, AssetAction } from '../../entities/asset-history.entity';
import { AssetPhoto } from '../../entities/asset-photo.entity';
import { User } from '../../entities/user.entity';
import { Category } from '../../entities/category.entity';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';
import * as fs from 'fs';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    @InjectRepository(AssetHistory)
    private historyRepository: Repository<AssetHistory>,
    @InjectRepository(AssetPhoto)
    private photoRepository: Repository<AssetPhoto>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(AuditEvent)
    private auditEventRepository: Repository<AuditEvent>,
  ) { }

  private async logAuditEvent(
    action: AuditAction,
    entityId: number,
    actorId: number | undefined,
    metadata: Record<string, any>,
  ) {
    const event = this.auditEventRepository.create({
      action,
      entityType: 'asset',
      entityId,
      actorId,
      metadata,
    });
    await this.auditEventRepository.save(event);
  }

  private async logAction(
    assetId: number,
    action: AssetAction,
    params: {
      userId?: number;
      assignedToId?: number;
      location?: string;
      notes?: string;
      changes?: any;
    } = {},
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(AssetHistory) : this.historyRepository;
    const history = repo.create({
      assetId,
      action,
      performedById: params.userId,
      assignedToId: params.assignedToId,
      location: params.location,
      notes: params.notes,
      changes: params.changes,
    });
    await repo.save(history);
  }

  async findAll(user?: any): Promise<Asset[]> {
    const query = this.assetsRepository.createQueryBuilder('asset')
      .leftJoinAndSelect('asset.assignedTo', 'assignedTo')
      .leftJoinAndSelect('asset.photos', 'photos')
      .leftJoinAndSelect('asset.businessOwner', 'businessOwner')
      .leftJoinAndSelect('asset.brandObj', 'brandObj')
      .leftJoinAndSelect('asset.vendorObj', 'vendorObj')
      .orderBy('asset.createdAt', 'DESC');

    // RBAC: If not Admin, only show assets assigned to the user
    if (user && user.role?.name !== 'Admin') {
      query.where('asset.assignedToId = :userId', { userId: user.id });
    }

    return query.getMany();
  }

  async findOne(id: number, user?: any): Promise<Asset> {
    const asset = await this.assetsRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'photos', 'businessOwner', 'brandObj', 'vendorObj'],
    });
    if (!asset) throw new NotFoundException('Asset not found');

    if (user && user.role?.name !== 'Admin' && asset.assignedToId !== user.id) {
      throw new ForbiddenException('Access denied to this asset');
    }

    return asset;
  }

  async create(data: any, userId?: number, manager?: EntityManager): Promise<Asset> {
    const repo = manager ? manager.getRepository(Asset) : this.assetsRepository;

    // Auto-generate asset tag if not provided
    if (!data.assetTag && data.category) {
      const { assetTag } = await this.generateNextTag(data.category);
      data.assetTag = assetTag;
    }

    const asset = repo.create({
      assetTag: data.assetTag,
      name: data.name,
      category: data.category,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      status: data.status || AssetStatus.AVAILABLE,
      condition: data.condition,
      purchaseDate: data.purchaseDate,
      purchaseCost: data.purchaseCost,
      vendor: data.vendor,
      brandId: data.brandId,
      vendorId: data.vendorId,
      warrantyExpiry: data.warrantyExpiry,
      location: data.location,
      usefulLifeYears: data.usefulLifeYears || 3,
      salvageValue: data.salvageValue,
      acquisitionType: data.acquisitionType,
      receivedFromVendorDate: data.receivedFromVendorDate,
      vendorMonthlyRent: data.vendorMonthlyRent,
      notes: data.notes,
      hostname: data.hostname,
      site: data.site,
      building: data.building,
      floor: data.floor,
      roomDesk: data.roomDesk,
      poNumber: data.poNumber,
      invoiceNumber: data.invoiceNumber,
      costCenter: data.costCenter,
      businessOwnerId: data.businessOwnerId,
      warrantyType: data.warrantyType,
      warrantyStart: data.warrantyStart,
      maintenanceCycleDays: data.maintenanceCycleDays,
    });

    // Calculate initial current value
    if (asset.purchaseCost) {
      asset.currentValue = asset.purchaseCost;
    }

    const savedAsset = await repo.save(asset);
    await this.logAction(savedAsset.id, AssetAction.CREATED, {
      userId,
      location: asset.location,
      notes: 'Initial inventory entry',
    }, manager);
    return savedAsset;
  }

  async generateNextTag(categoryName: string): Promise<{ assetTag: string }> {
    const category = await this.categoryRepository.createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:value)', { value: categoryName })
      .orWhere('LOWER(category.code) = LOWER(:value)', { value: categoryName })
      .getOne();

    // Default prefix to first 3 letters of category if no code defined
    let prefix = category?.code || categoryName.substring(0, 3).toUpperCase();
    prefix = prefix.toUpperCase();

    // Find the latest asset with this prefix
    const latestAsset = await this.assetsRepository.find({
      where: { assetTag: Like(`${prefix}-%`) },
      order: { assetTag: 'DESC' },
      take: 1,
    });

    let nextNumber = 1;
    if (latestAsset.length > 0) {
      const lastTag = latestAsset[0].assetTag;
      const parts = lastTag.split('-');
      const lastNumberString = parts[parts.length - 1];
      const lastNumber = parseInt(lastNumberString);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const assetTag = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    return { assetTag };
  }

  async update(id: number, data: any, userId?: number): Promise<Asset> {
    const asset = await this.findOne(id);
    const original = { ...asset };

    // Helper: treat empty strings as null for nullable fields
    const valOrKeep = (val: any, current: any) =>
      val === undefined ? current : val === '' ? null : val;

    const fieldsToTrack = [
      'name', 'category', 'brandId', 'vendorId', 'model', 'serialNumber', 'status', 'condition',
      'purchaseDate', 'purchaseCost', 'vendor', 'warrantyExpiry', 'location',
      'usefulLifeYears', 'salvageValue', 'acquisitionType',
      'receivedFromVendorDate', 'vendorMonthlyRent', 'notes',
      'hostname',
      'poNumber', 'invoiceNumber', 'costCenter', 'businessOwnerId',
      'warrantyType', 'warrantyStart', 'maintenanceCycleDays'
    ];

    const changes: any = {};
    fieldsToTrack.forEach(field => {
      const newVal = valOrKeep(data[field], asset[field]);
      const oldVal = asset[field];

      // Comparison logic for dates and numbers
      let isChanged = false;
      if (oldVal instanceof Date || (typeof oldVal === 'string' && !isNaN(Date.parse(oldVal)))) {
        const d1 = new Date(oldVal).getTime();
        const d2 = newVal ? new Date(newVal).getTime() : 0;
        isChanged = d1 !== d2;
      } else {
        isChanged = newVal != oldVal;
      }

      if (isChanged) {
        changes[field] = { old: oldVal, new: newVal };
        asset[field] = newVal;
      }
    });

    if (Object.keys(changes).length === 0) return asset;

    const updatedAsset = await this.assetsRepository.save(asset);

    if (changes.location) {
      await this.logAction(id, AssetAction.LOCATION_CHANGE, {
        userId,
        location: asset.location,
        notes: `Location changed from ${original.location || 'N/A'} to ${asset.location}`,
        changes
      });
    } else {
      await this.logAction(id, AssetAction.UPDATED, { userId, changes });
    }

    return updatedAsset;
  }

  async deploy(
    id: number,
    data: any,
    performedBy?: number,
  ): Promise<Asset> {
    if (!data.reason || !data.reason.trim()) {
      throw new BadRequestException('A reason is required to deploy an asset');
    }

    const asset = await this.findOne(id);

    // Validate against category policy
    const category = await this.categoryRepository.findOneBy({ name: asset.category });
    if (category && category.allowedTargetTypes && !category.allowedTargetTypes.includes(data.targetType)) {
      throw new BadRequestException(`Category ${asset.category} does not allow ${data.targetType} assignments. Allowed: ${category.allowedTargetTypes.join(', ')}`);
    }

    let assignedUser: User | null = null;
    if (data.targetType === 'PERSON') {
      if (!data.userId) throw new BadRequestException('User ID is required for PERSON assignment');
      assignedUser = await this.usersRepository.findOneBy({ id: data.userId });
      if (!assignedUser) throw new NotFoundException('User not found');
      asset.assignedTo = assignedUser;
      asset.assignedToId = data.userId;
    } else {
      // For LOCATION or others, we unassign from person
      asset.assignedTo = null;
      asset.assignedToId = null;
    }

    if (data.location) asset.location = data.location;
    if (data.site) asset.site = data.site;
    if (data.building) asset.building = data.building;
    if (data.floor) asset.floor = data.floor;
    if (data.roomDesk) asset.roomDesk = data.roomDesk;

    asset.deploymentDate = data.deploymentDate ? new Date(data.deploymentDate) : new Date();
    asset.status = AssetStatus.DEPLOYED;

    const savedAsset = await this.assetsRepository.save(asset);
    const deployNotes = `Deployed to ${data.targetType}${data.targetType === 'LOCATION' ? ': ' + asset.location : ''}. Reason: ${data.reason}`;
    await this.logAction(id, AssetAction.CHECKOUT, {
      userId: performedBy,
      assignedToId: asset.assignedToId,
      location: asset.location,
      notes: deployNotes,
    });
    await this.logAuditEvent(AuditAction.ISSUE, id, performedBy, {
      assetTag: asset.assetTag,
      assetName: asset.name,
      targetType: data.targetType,
      assignedToId: asset.assignedToId,
      assignedToName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : undefined,
      assignedToEmail: assignedUser?.email,
      location: asset.location,
      reason: data.reason,
    });
    return savedAsset;
  }

  async undeploy(id: number, reason: string, condition: AssetCondition, performedBy?: number): Promise<Asset> {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is required to undeploy an asset');
    }
    if (!condition) {
      throw new BadRequestException('The asset condition on return is required to undeploy an asset');
    }

    const asset = await this.findOne(id);
    const previousAssignedToId = asset.assignedToId;
    const previousUser = previousAssignedToId
      ? await this.usersRepository.findOneBy({ id: previousAssignedToId })
      : null;

    asset.assignedTo = null;
    asset.assignedToId = null;
    asset.status = AssetStatus.AVAILABLE;
    asset.condition = condition;

    const savedAsset = await this.assetsRepository.save(asset);
    await this.logAction(id, AssetAction.CHECKIN, {
      userId: performedBy,
      assignedToId: previousAssignedToId,
      notes: `Returned to inventory. Condition: ${condition}. Reason: ${reason}`,
    });
    await this.logAuditEvent(AuditAction.RETURN, id, performedBy, {
      assetTag: asset.assetTag,
      assetName: asset.name,
      previousAssignedToId,
      returnedByName: previousUser ? `${previousUser.firstName} ${previousUser.lastName}` : undefined,
      returnedByEmail: previousUser?.email,
      reason,
      conditionOnReturn: condition,
    });
    return savedAsset;
  }

  async scheduleMaintenance(id: number, data: any, performedBy?: number): Promise<Asset> {
    const asset = await this.findOne(id);

    asset.lastMaintenanceDate = data.lastMaintenanceDate || new Date();
    asset.nextMaintenanceDate = data.nextMaintenanceDate;
    asset.maintenanceNotes = data.maintenanceNotes;
    asset.status = AssetStatus.MAINTENANCE;

    const savedAsset = await this.assetsRepository.save(asset);
    await this.logAction(id, AssetAction.MAINTENANCE_START, {
      userId: performedBy,
      notes: data.maintenanceNotes,
    });
    return savedAsset;
  }

  async completeMaintenance(id: number, data?: any, performedBy?: number): Promise<Asset> {
    const asset = await this.findOne(id);

    if (data) {
      if (data.maintenanceCompletedDate) asset.lastMaintenanceDate = new Date(data.maintenanceCompletedDate);
      if (data.nextMaintenanceDate) asset.nextMaintenanceDate = new Date(data.nextMaintenanceDate);
      if (data.completionNotes) asset.maintenanceNotes = data.completionNotes;
    }

    asset.status = asset.assignedToId
      ? AssetStatus.DEPLOYED
      : AssetStatus.AVAILABLE;

    const savedAsset = await this.assetsRepository.save(asset);
    await this.logAction(id, AssetAction.MAINTENANCE_END, {
      userId: performedBy,
      notes: data?.workPerformed || data?.completionNotes || 'Maintenance completed',
    });
    return savedAsset;
  }

  async calculateDepreciation(id: number, performedBy?: number): Promise<Asset> {
    const asset = await this.findOne(id);

    if (!asset.purchaseDate || !asset.purchaseCost) {
      throw new Error(
        'Purchase date and cost required for depreciation calculation',
      );
    }

    const purchaseDate = new Date(asset.purchaseDate);
    const currentDate = new Date();
    const yearsElapsed =
      (currentDate.getTime() - purchaseDate.getTime()) /
      (1000 * 60 * 60 * 24 * 365);

    const salvageValue = asset.salvageValue || 0;
    const depreciationPerYear =
      (asset.purchaseCost - salvageValue) / asset.usefulLifeYears;
    const totalDepreciation = depreciationPerYear * Math.max(0, yearsElapsed);

    const oldVal = asset.currentValue;
    asset.currentValue = Math.max(
      asset.purchaseCost - totalDepreciation,
      salvageValue,
    );

    const savedAsset = await this.assetsRepository.save(asset);

    // Store formula details in audit log
    await this.logAction(id, AssetAction.DEPRECIATION, {
      userId: performedBy,
      notes: `Depreciation calculated using Straight-Line method.`,
      changes: {
        currentValue: { old: oldVal, new: asset.currentValue },
        formulaDetails: {
          purchaseCost: asset.purchaseCost,
          yearsElapsed: parseFloat(yearsElapsed.toFixed(2)),
          annualDepreciation: parseFloat(depreciationPerYear.toFixed(2)),
          totalDepreciation: parseFloat(totalDepreciation.toFixed(2)),
          salvageValue: salvageValue
        }
      }
    });
    return savedAsset;
  }

  async dispose(id: number, data: any, performedBy?: number): Promise<Asset> {
    const asset = await this.findOne(id);

    if (asset.assignedToId || asset.location || asset.site) {
      throw new BadRequestException('Cannot dispose an asset that is currently assigned to a user or location. Please undeploy it first.');
    }

    asset.status = AssetStatus.DISPOSED;
    asset.disposalDate = data.disposalDate || new Date();
    asset.disposalMethod = data.disposalMethod;
    asset.disposalNotes = data.disposalNotes;
    asset.assignedTo = null;
    asset.assignedToId = null;

    const savedAsset = await this.assetsRepository.save(asset);
    await this.logAction(id, AssetAction.DISPOSED, {
      userId: performedBy,
      notes: data.disposalNotes,
    });
    return savedAsset;
  }

  async getHistory(assetId: number, user?: any): Promise<AssetHistory[]> {
    await this.findOne(assetId, user); // Verify existence and permission
    return this.historyRepository.find({
      where: { assetId },
      relations: ['performedBy', 'assignedTo'],
      order: { actionDate: 'DESC' },
    });
  }

  async delete(id: number): Promise<void> {
    const asset = await this.findOne(id);
    if (asset.assignedToId || asset.location || asset.site) {
      throw new BadRequestException('Cannot delete an asset that is currently assigned to a user or location. Please undeploy it first.');
    }

    // Assets that were ever deployed have assignment history and appear in
    // audit reports — they must be disposed, not deleted, to keep audit trails intact.
    const assignmentHistoryCount = await this.historyRepository.count({
      where: [
        { assetId: id, action: AssetAction.CHECKOUT },
        { assetId: id, action: AssetAction.CHECKIN },
      ],
    });
    if (assignmentHistoryCount > 0) {
      throw new BadRequestException('This asset has assignment history and appears in audit reports. It cannot be deleted — dispose it instead.');
    }

    await this.assetsRepository.softRemove(asset);
  }



  async uploadPhotos(
    assetId: number,
    files: Express.Multer.File[],
    body: any,
  ): Promise<any[]> {
    const asset = await this.findOne(assetId);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const photos = [];
    for (const file of files) {
      const photo = this.photoRepository.create({
        assetId: asset.id,
        filename: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        condition: body.condition || 'good',
        notes: body.notes,
      });
      const savedPhoto = await this.photoRepository.save(photo);

      // Extract just the relative path from uploads/ onward
      const relativePath = file.path.replace(/\\/g, '/').replace(/^\.\//, '');

      // Transform to include URL
      photos.push({
        id: savedPhoto.id,
        assetId: savedPhoto.assetId,
        filename: savedPhoto.filename,
        url: `/${relativePath}`,
        fileSize: savedPhoto.fileSize,
        mimeType: savedPhoto.mimeType,
        condition: savedPhoto.condition,
        notes: savedPhoto.notes,
        uploadedAt: savedPhoto.uploadedAt,
        size: savedPhoto.fileSize, // Frontend expects 'size' field
      });
    }

    return photos;
  }

  async getPhotos(assetId: number): Promise<any[]> {
    await this.findOne(assetId); // Verify asset exists
    const photos = await this.photoRepository.find({
      where: { assetId },
      order: { uploadedAt: 'DESC' },
    });

    // Transform to include URL
    return photos.map((photo) => {
      // Extract just the relative path from uploads/ onward
      const relativePath = photo.filePath
        .replace(/\\/g, '/')
        .replace(/^\.\//, '');

      return {
        id: photo.id,
        assetId: photo.assetId,
        filename: photo.filename,
        url: `/${relativePath}`,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        condition: photo.condition,
        notes: photo.notes,
        uploadedAt: photo.uploadedAt,
        size: photo.fileSize, // Frontend expects 'size' field
      };
    });
  }

  async deletePhoto(assetId: number, photoId: number): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId, assetId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // Delete file from disk
    if (fs.existsSync(photo.filePath)) {
      fs.unlinkSync(photo.filePath);
    }

    await this.photoRepository.remove(photo);
  }

  async validateImport(fileBuffer: Buffer): Promise<{ data: any[] }> {
    const { parse } = require('csv-parse/sync');
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const mapping: Record<string, string> = {
      'Asset Tag': 'assetTag',
      'Name': 'name',
      'Category': 'category',
      'Brand': 'brand',
      'Model': 'model',
      'Serial Number': 'serialNumber',
      'Status': 'status',
      'Condition': 'condition',
      'Purchase Date': 'purchaseDate',
      'Purchase Cost': 'purchaseCost',
      'Vendor': 'vendor',
      'Warranty Expiry': 'warrantyExpiry',
      'Notes': 'notes',
      'Hostname': 'hostname',
      'PO Number': 'poNumber',
      'Invoice Number': 'invoiceNumber',
      'Cost Center': 'costCenter',
      'Useful Life Years': 'usefulLifeYears',
      'Salvage Value': 'salvageValue'
    };

    const categories = await this.categoryRepository.find();

    const validatedData = [];
    for (const record of records) {
      const mappedData: any = {};
      Object.keys(record).forEach(key => {
        const targetKey = mapping[key] || key;
        mappedData[targetKey] = record[key];
      });

      const errors = [];
      if (!mappedData.name) errors.push('Name is required');

      const categoryInput = mappedData.category?.toString().trim();
      if (!categoryInput) {
        errors.push('Category is required');
      } else {
        const matchedCategory = categories.find(c =>
          c.name.toLowerCase() === categoryInput.toLowerCase() ||
          (c.code && c.code.toLowerCase() === categoryInput.toLowerCase())
        );

        if (!matchedCategory) {
          errors.push(`Category "${mappedData.category}" is not valid`);
        } else {
          mappedData.category = matchedCategory.name;
        }
      }

      // Always generate the tag automatically during import regardless of Excel values
      mappedData.assetTag = undefined;

      validatedData.push({
        ...mappedData,
        _errors: errors,
        _isValid: errors.length === 0
      });
    }

    return { data: validatedData };
  }

  async bulkCreate(assets: any[], userId?: number): Promise<{ success: number; failed: number; errors: any[] }> {
    let success = 0;
    let failed = 0;
    const errors = [];

    for (const assetData of assets) {
      try {
        // Normalization
        if (assetData.status) assetData.status = assetData.status.toLowerCase();
        if (assetData.category) assetData.category = assetData.category.toLowerCase();
        if (assetData.condition) assetData.condition = assetData.condition.toLowerCase();
        if (assetData.acquisitionType) assetData.acquisitionType = assetData.acquisitionType.toLowerCase();

        await this.create(assetData, userId);
        success++;
      } catch (err) {
        failed++;
        errors.push({
          tag: assetData.assetTag || 'Unknown',
          message: err.message,
        });
      }
    }

    return { success, failed, errors };
  }

  async importAssets(fileBuffer: Buffer, userId?: number): Promise<{ success: number; failed: number; errors: any[] }> {
    const { data } = await this.validateImport(fileBuffer);
    return this.bulkCreate(data, userId);
  }
  async getStatistics(user?: any) {
    const query = this.assetsRepository.createQueryBuilder('asset');
    
    if (user && user.role?.name !== 'Admin') {
      query.where('asset.assignedToId = :userId', { userId: user.id });
    }

    const assets = await query.getMany();

    return {
      total: assets.length,
      available: assets.filter(a => a.status === AssetStatus.AVAILABLE).length,
      deployed: assets.filter(a => a.status === AssetStatus.DEPLOYED).length,
      maintenance: assets.filter(a => [AssetStatus.MAINTENANCE, AssetStatus.REPAIR, AssetStatus.IN_REPAIR].includes(a.status)).length,
      decommissioned: assets.filter(a => a.status === AssetStatus.RETIRED || a.status === AssetStatus.DISPOSED).length,
    };
  }
}
