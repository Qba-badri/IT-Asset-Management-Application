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
exports.AssignmentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const assignments_service_1 = require("./assignments.service");
const assignment_dto_1 = require("./dto/assignment.dto");
let AssignmentsController = class AssignmentsController {
    constructor(assignmentsService) {
        this.assignmentsService = assignmentsService;
    }
    issue(dto, req) {
        return this.assignmentsService.issue(dto, req.user.id);
    }
    processReturn(dto, req) {
        return this.assignmentsService.processReturn(dto, req.user.id);
    }
    transfer(dto, req) {
        return this.assignmentsService.transfer(dto, req.user.id);
    }
    writeOff(dto, req) {
        return this.assignmentsService.writeOff(dto, req.user.id);
    }
    getHoldings(query) {
        return this.assignmentsService.getHoldings(query);
    }
    getOverdue(query) {
        return this.assignmentsService.getOverdue(query);
    }
    findOne(id) {
        return this.assignmentsService.findOne(id);
    }
};
exports.AssignmentsController = AssignmentsController;
__decorate([
    (0, common_1.Post)('issue'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assignment_dto_1.IssueDto, Object]),
    __metadata("design:returntype", void 0)
], AssignmentsController.prototype, "issue", null);
__decorate([
    (0, common_1.Post)('return'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assignment_dto_1.ReturnDto, Object]),
    __metadata("design:returntype", void 0)
], AssignmentsController.prototype, "processReturn", null);
__decorate([
    (0, common_1.Post)('transfer'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assignment_dto_1.TransferDto, Object]),
    __metadata("design:returntype", void 0)
], AssignmentsController.prototype, "transfer", null);
__decorate([
    (0, common_1.Post)('write-off'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assignment_dto_1.WriteOffDto, Object]),
    __metadata("design:returntype", void 0)
], AssignmentsController.prototype, "writeOff", null);
__decorate([
    (0, common_1.Get)('holdings'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assignment_dto_1.HoldingsQueryDto]),
    __metadata("design:returntype", void 0)
], AssignmentsController.prototype, "getHoldings", null);
__decorate([
    (0, common_1.Get)('overdue'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assignment_dto_1.OverdueQueryDto]),
    __metadata("design:returntype", void 0)
], AssignmentsController.prototype, "getOverdue", null);
__decorate([
    (0, common_1.Get)('assignments/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AssignmentsController.prototype, "findOne", null);
exports.AssignmentsController = AssignmentsController = __decorate([
    (0, common_1.Controller)('api'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [assignments_service_1.AssignmentsService])
], AssignmentsController);
//# sourceMappingURL=assignments.controller.js.map