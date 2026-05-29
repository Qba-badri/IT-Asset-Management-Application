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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const catalog_item_entity_1 = require("../entities/catalog-item.entity");
let CatalogService = class CatalogService {
    constructor(catalogRepo) {
        this.catalogRepo = catalogRepo;
    }
    async create(dto) {
        const existing = await this.catalogRepo.findOne({
            where: { sku: dto.sku },
        });
        if (existing) {
            throw new common_1.ConflictException(`Catalog item with SKU "${dto.sku}" already exists`);
        }
        const item = this.catalogRepo.create(dto);
        return this.catalogRepo.save(item);
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 25;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.returnPolicy)
            where.returnPolicy = query.returnPolicy;
        if (query.trackMode)
            where.trackMode = query.trackMode;
        if (query.categoryId)
            where.categoryId = query.categoryId;
        if (query.isActive !== undefined)
            where.isActive = query.isActive;
        const qb = this.catalogRepo
            .createQueryBuilder('ci')
            .leftJoinAndSelect('ci.category', 'category')
            .where(where)
            .skip(skip)
            .take(limit)
            .orderBy('ci.name', 'ASC');
        if (query.search) {
            qb.andWhere('(ci.name ILIKE :search OR ci.sku ILIKE :search OR ci.brand ILIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }
    async findOne(id) {
        const item = await this.catalogRepo.findOne({
            where: { id },
            relations: ['category'],
        });
        if (!item)
            throw new common_1.NotFoundException(`Catalog item #${id} not found`);
        return item;
    }
    async findBySku(sku) {
        const item = await this.catalogRepo.findOne({
            where: { sku },
            relations: ['category'],
        });
        if (!item)
            throw new common_1.NotFoundException(`Catalog item with SKU "${sku}" not found`);
        return item;
    }
    async update(id, dto) {
        const item = await this.findOne(id);
        Object.assign(item, dto);
        return this.catalogRepo.save(item);
    }
    async deactivate(id) {
        return this.update(id, { isActive: false });
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(catalog_item_entity_1.CatalogItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map