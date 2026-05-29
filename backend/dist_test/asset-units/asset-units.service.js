"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetUnitsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const asset_unit_entity_1 = require("../entities/asset-unit.entity");
const catalog_item_entity_1 = require("../entities/catalog-item.entity");
let AssetUnitsService = class AssetUnitsService {
    constructor(assetUnitRepo, catalogRepo) {
        this.assetUnitRepo = assetUnitRepo;
        this.catalogRepo = catalogRepo;
    }
    async create(dto) {
        const catalog = await this.catalogRepo.findOne({
            where: { id: dto.catalogItemId },
        });
        if (!catalog)
            throw new common_1.NotFoundException(`Catalog item #${dto.catalogItemId} not found`);
        if (catalog.trackMode !== catalog_item_entity_1.TrackMode.SERIALIZED) {
            throw new common_1.BadRequestException('Asset units can only be created for SERIALIZED catalog items');
        }
        const existing = await this.assetUnitRepo.findOne({
            where: { assetTag: dto.assetTag },
        });
        if (existing)
            throw new common_1.ConflictException(`Asset tag "${dto.assetTag}" already exists`);
        const unit = this.assetUnitRepo.create(dto);
        return this.assetUnitRepo.save(unit);
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 25;
        const skip = (page - 1) * limit;
        const qb = this.assetUnitRepo
            .createQueryBuilder('au')
            .leftJoinAndSelect('au.catalogItem', 'catalogItem')
            .leftJoinAndSelect('au.location', 'location')
            .skip(skip)
            .take(limit)
            .orderBy('au.assetTag', 'ASC');
        if (query.catalogItemId)
            qb.andWhere('au.catalogItemId = :catId', { catId: query.catalogItemId });
        if (query.status)
            qb.andWhere('au.status = :status', { status: query.status });
        if (query.locationId)
            qb.andWhere('au.locationId = :locId', { locId: query.locationId });
        if (query.search) {
            qb.andWhere('(au.assetTag ILIKE :s OR au.serialNumber ILIKE :s)', {
                s: `%${query.search}%`,
            });
        }
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }
    async findOne(id) {
        const unit = await this.assetUnitRepo.findOne({
            where: { id },
            relations: ['catalogItem', 'location'],
        });
        if (!unit)
            throw new common_1.NotFoundException(`Asset unit #${id} not found`);
        return unit;
    }
    async findByAssetTag(assetTag) {
        const unit = await this.assetUnitRepo.findOne({
            where: { assetTag },
            relations: ['catalogItem', 'location'],
        });
        if (!unit)
            throw new common_1.NotFoundException(`Asset unit "${assetTag}" not found`);
        return unit;
    }
    async update(id, dto) {
        const unit = await this.findOne(id);
        Object.assign(unit, dto);
        return this.assetUnitRepo.save(unit);
    }
};
exports.AssetUnitsService = AssetUnitsService;
exports.AssetUnitsService = AssetUnitsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(asset_unit_entity_1.AssetUnit)),
    __param(1, (0, typeorm_1.InjectRepository)(catalog_item_entity_1.CatalogItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AssetUnitsService);
//# sourceMappingURL=asset-units.service.js.map