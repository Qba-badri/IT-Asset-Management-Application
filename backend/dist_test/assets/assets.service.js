"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const asset_entity_1 = require("../entities/asset.entity");
const asset_history_entity_1 = require("../entities/asset-history.entity");
const asset_photo_entity_1 = require("../entities/asset-photo.entity");
const user_entity_1 = require("../entities/user.entity");
const category_entity_1 = require("../entities/category.entity");
const fs = __importStar(require("fs"));
let AssetsService = class AssetsService {
    constructor(assetsRepository, historyRepository, photoRepository, usersRepository, categoryRepository) {
        this.assetsRepository = assetsRepository;
        this.historyRepository = historyRepository;
        this.photoRepository = photoRepository;
        this.usersRepository = usersRepository;
        this.categoryRepository = categoryRepository;
    }
    async logAction(assetId, action, params = {}, manager) {
        const repo = manager ? manager.getRepository(asset_history_entity_1.AssetHistory) : this.historyRepository;
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
    async findAll() {
        return this.assetsRepository.find({
            relations: ['assignedTo', 'photos', 'businessOwner', 'brandObj', 'vendorObj'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const asset = await this.assetsRepository.findOne({
            where: { id },
            relations: ['assignedTo', 'photos', 'businessOwner', 'brandObj', 'vendorObj'],
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        return asset;
    }
    async create(data, userId, manager) {
        const repo = manager ? manager.getRepository(asset_entity_1.Asset) : this.assetsRepository;
        const asset = repo.create({
            assetTag: data.assetTag,
            name: data.name,
            category: data.category,
            brand: data.brand,
            model: data.model,
            serialNumber: data.serialNumber,
            status: data.status || asset_entity_1.AssetStatus.AVAILABLE,
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
        if (asset.purchaseCost) {
            asset.currentValue = asset.purchaseCost;
        }
        const savedAsset = await repo.save(asset);
        await this.logAction(savedAsset.id, asset_history_entity_1.AssetAction.CREATED, {
            userId,
            location: asset.location,
            notes: 'Initial inventory entry',
        }, manager);
        return savedAsset;
    }
    async update(id, data, userId) {
        const asset = await this.findOne(id);
        const original = { ...asset };
        const valOrKeep = (val, current) => val === undefined ? current : val === '' ? null : val;
        const fieldsToTrack = [
            'name', 'category', 'brandId', 'vendorId', 'model', 'serialNumber', 'status', 'condition',
            'purchaseDate', 'purchaseCost', 'vendor', 'warrantyExpiry', 'location',
            'usefulLifeYears', 'salvageValue', 'acquisitionType',
            'receivedFromVendorDate', 'vendorMonthlyRent', 'notes',
            'hostname',
            'poNumber', 'invoiceNumber', 'costCenter', 'businessOwnerId',
            'warrantyType', 'warrantyStart', 'maintenanceCycleDays'
        ];
        const changes = {};
        fieldsToTrack.forEach(field => {
            const newVal = valOrKeep(data[field], asset[field]);
            const oldVal = asset[field];
            let isChanged = false;
            if (oldVal instanceof Date || (typeof oldVal === 'string' && !isNaN(Date.parse(oldVal)))) {
                const d1 = new Date(oldVal).getTime();
                const d2 = newVal ? new Date(newVal).getTime() : 0;
                isChanged = d1 !== d2;
            }
            else {
                isChanged = newVal != oldVal;
            }
            if (isChanged) {
                changes[field] = { old: oldVal, new: newVal };
                asset[field] = newVal;
            }
        });
        if (Object.keys(changes).length === 0)
            return asset;
        const updatedAsset = await this.assetsRepository.save(asset);
        if (changes.location) {
            await this.logAction(id, asset_history_entity_1.AssetAction.LOCATION_CHANGE, {
                userId,
                location: asset.location,
                notes: `Location changed from ${original.location || 'N/A'} to ${asset.location}`,
                changes
            });
        }
        else {
            await this.logAction(id, asset_history_entity_1.AssetAction.UPDATED, { userId, changes });
        }
        return updatedAsset;
    }
    async deploy(id, data, performedBy) {
        const asset = await this.findOne(id);
        const category = await this.categoryRepository.findOneBy({ name: asset.category });
        if (category && category.allowedTargetTypes && !category.allowedTargetTypes.includes(data.targetType)) {
            throw new common_1.BadRequestException(`Category ${asset.category} does not allow ${data.targetType} assignments. Allowed: ${category.allowedTargetTypes.join(', ')}`);
        }
        if (data.targetType === 'PERSON') {
            if (!data.userId)
                throw new common_1.BadRequestException('User ID is required for PERSON assignment');
            const user = await this.usersRepository.findOneBy({ id: data.userId });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            asset.assignedTo = user;
            asset.assignedToId = data.userId;
        }
        else {
            asset.assignedTo = null;
            asset.assignedToId = null;
        }
        if (data.location)
            asset.location = data.location;
        if (data.site)
            asset.site = data.site;
        if (data.building)
            asset.building = data.building;
        if (data.floor)
            asset.floor = data.floor;
        if (data.roomDesk)
            asset.roomDesk = data.roomDesk;
        asset.deploymentDate = data.deploymentDate ? new Date(data.deploymentDate) : new Date();
        asset.status = asset_entity_1.AssetStatus.DEPLOYED;
        const savedAsset = await this.assetsRepository.save(asset);
        await this.logAction(id, asset_history_entity_1.AssetAction.CHECKOUT, {
            userId: performedBy,
            assignedToId: asset.assignedToId,
            location: asset.location,
            notes: `Deployed to ${data.targetType}${data.targetType === 'LOCATION' ? ': ' + asset.location : ''}`,
        });
        return savedAsset;
    }
    async undeploy(id, performedBy) {
        const asset = await this.findOne(id);
        asset.assignedTo = null;
        asset.assignedToId = null;
        asset.status = asset_entity_1.AssetStatus.AVAILABLE;
        const savedAsset = await this.assetsRepository.save(asset);
        await this.logAction(id, asset_history_entity_1.AssetAction.CHECKIN, {
            userId: performedBy,
            notes: 'Returned to inventory',
        });
        return savedAsset;
    }
    async scheduleMaintenance(id, data, performedBy) {
        const asset = await this.findOne(id);
        asset.lastMaintenanceDate = data.lastMaintenanceDate || new Date();
        asset.nextMaintenanceDate = data.nextMaintenanceDate;
        asset.maintenanceNotes = data.maintenanceNotes;
        asset.status = asset_entity_1.AssetStatus.MAINTENANCE;
        const savedAsset = await this.assetsRepository.save(asset);
        await this.logAction(id, asset_history_entity_1.AssetAction.MAINTENANCE_START, {
            userId: performedBy,
            notes: data.maintenanceNotes,
        });
        return savedAsset;
    }
    async completeMaintenance(id, performedBy) {
        const asset = await this.findOne(id);
        asset.status = asset.assignedToId
            ? asset_entity_1.AssetStatus.DEPLOYED
            : asset_entity_1.AssetStatus.AVAILABLE;
        const savedAsset = await this.assetsRepository.save(asset);
        await this.logAction(id, asset_history_entity_1.AssetAction.MAINTENANCE_END, { userId: performedBy });
        return savedAsset;
    }
    async calculateDepreciation(id, performedBy) {
        const asset = await this.findOne(id);
        if (!asset.purchaseDate || !asset.purchaseCost) {
            throw new Error('Purchase date and cost required for depreciation calculation');
        }
        const purchaseDate = new Date(asset.purchaseDate);
        const currentDate = new Date();
        const yearsElapsed = (currentDate.getTime() - purchaseDate.getTime()) /
            (1000 * 60 * 60 * 24 * 365);
        const salvageValue = asset.salvageValue || 0;
        const depreciationPerYear = (asset.purchaseCost - salvageValue) / asset.usefulLifeYears;
        const totalDepreciation = depreciationPerYear * Math.max(0, yearsElapsed);
        const oldVal = asset.currentValue;
        asset.currentValue = Math.max(asset.purchaseCost - totalDepreciation, salvageValue);
        const savedAsset = await this.assetsRepository.save(asset);
        await this.logAction(id, asset_history_entity_1.AssetAction.DEPRECIATION, {
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
    async dispose(id, data, performedBy) {
        const asset = await this.findOne(id);
        asset.status = asset_entity_1.AssetStatus.DISPOSED;
        asset.disposalDate = data.disposalDate || new Date();
        asset.disposalMethod = data.disposalMethod;
        asset.disposalNotes = data.disposalNotes;
        asset.assignedTo = null;
        asset.assignedToId = null;
        const savedAsset = await this.assetsRepository.save(asset);
        await this.logAction(id, asset_history_entity_1.AssetAction.DISPOSED, {
            userId: performedBy,
            notes: data.disposalNotes,
        });
        return savedAsset;
    }
    async getHistory(id) {
        return this.historyRepository.find({
            where: { assetId: id },
            relations: ['performedBy', 'assignedTo'],
            order: { actionDate: 'DESC' },
        });
    }
    async delete(id) {
        const asset = await this.findOne(id);
        await this.assetsRepository.remove(asset);
    }
    async getStatistics() {
        const total = await this.assetsRepository.count();
        const deployed = await this.assetsRepository.count({
            where: { status: asset_entity_1.AssetStatus.DEPLOYED },
        });
        const available = await this.assetsRepository.count({
            where: { status: asset_entity_1.AssetStatus.AVAILABLE },
        });
        const maintenance = await this.assetsRepository.count({
            where: [
                { status: asset_entity_1.AssetStatus.MAINTENANCE },
                { status: asset_entity_1.AssetStatus.REPAIR },
            ],
        });
        const disposed = await this.assetsRepository.count({
            where: { status: asset_entity_1.AssetStatus.DISPOSED },
        });
        return {
            total,
            deployed,
            available,
            maintenance,
            disposed,
        };
    }
    async uploadPhotos(assetId, files, body) {
        const asset = await this.findOne(assetId);
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files uploaded');
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
            const relativePath = file.path.replace(/\\/g, '/').replace(/^\.\//, '');
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
                size: savedPhoto.fileSize,
            });
        }
        return photos;
    }
    async getPhotos(assetId) {
        await this.findOne(assetId);
        const photos = await this.photoRepository.find({
            where: { assetId },
            order: { uploadedAt: 'DESC' },
        });
        return photos.map((photo) => {
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
                size: photo.fileSize,
            };
        });
    }
    async deletePhoto(assetId, photoId) {
        const photo = await this.photoRepository.findOne({
            where: { id: photoId, assetId },
        });
        if (!photo) {
            throw new common_1.NotFoundException('Photo not found');
        }
        if (fs.existsSync(photo.filePath)) {
            fs.unlinkSync(photo.filePath);
        }
        await this.photoRepository.remove(photo);
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(asset_entity_1.Asset)),
    __param(1, (0, typeorm_1.InjectRepository)(asset_history_entity_1.AssetHistory)),
    __param(2, (0, typeorm_1.InjectRepository)(asset_photo_entity_1.AssetPhoto)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AssetsService);
//# sourceMappingURL=assets.service.js.map