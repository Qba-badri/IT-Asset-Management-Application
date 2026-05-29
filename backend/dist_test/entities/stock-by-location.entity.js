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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockByLocation = void 0;
const typeorm_1 = require("typeorm");
const catalog_item_entity_1 = require("./catalog-item.entity");
const location_entity_1 = require("./location.entity");
let StockByLocation = class StockByLocation {
};
exports.StockByLocation = StockByLocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StockByLocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => catalog_item_entity_1.CatalogItem, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'catalogItemId' }),
    __metadata("design:type", catalog_item_entity_1.CatalogItem)
], StockByLocation.prototype, "catalogItem", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StockByLocation.prototype, "catalogItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => location_entity_1.Location, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'locationId' }),
    __metadata("design:type", location_entity_1.Location)
], StockByLocation.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StockByLocation.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], StockByLocation.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StockByLocation.prototype, "updatedAt", void 0);
exports.StockByLocation = StockByLocation = __decorate([
    (0, typeorm_1.Entity)('stock_by_location'),
    (0, typeorm_1.Unique)(['catalogItemId', 'locationId']),
    (0, typeorm_1.Check)('"quantity" >= 0'),
    (0, typeorm_1.Index)(['catalogItemId']),
    (0, typeorm_1.Index)(['locationId'])
], StockByLocation);
//# sourceMappingURL=stock-by-location.entity.js.map