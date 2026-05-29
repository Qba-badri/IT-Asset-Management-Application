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
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const stock_service_1 = require("./stock.service");
const stock_dto_1 = require("./dto/stock.dto");
let StockController = class StockController {
    constructor(stockService) {
        this.stockService = stockService;
    }
    initializeStock(dto, req) {
        return this.stockService.initializeStock(dto, req.user.id);
    }
    adjustStock(dto, req) {
        return this.stockService.adjustStock(dto, req.user.id);
    }
    findAll(query) {
        return this.stockService.findAll(query);
    }
    getLedger(query) {
        return this.stockService.getLedger(query);
    }
};
exports.StockController = StockController;
__decorate([
    (0, common_1.Post)('initialize'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_dto_1.InitialStockDto, Object]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "initializeStock", null);
__decorate([
    (0, common_1.Post)('adjust'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_dto_1.AdjustStockDto, Object]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_dto_1.StockQueryDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('ledger'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_dto_1.LedgerQueryDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "getLedger", null);
exports.StockController = StockController = __decorate([
    (0, common_1.Controller)('api/stock'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], StockController);
//# sourceMappingURL=stock.controller.js.map