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
exports.ProcurementService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const procurement_request_entity_1 = require("../entities/procurement-request.entity");
const purchase_order_entity_1 = require("../entities/purchase-order.entity");
const goods_receipt_entity_1 = require("../entities/goods-receipt.entity");
const approval_task_entity_1 = require("../entities/approval-task.entity");
const workflow_service_1 = require("./workflow.service");
const assets_service_1 = require("../assets/assets.service");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const user_entity_1 = require("../entities/user.entity");
let ProcurementService = class ProcurementService {
    constructor(prRepo, poRepo, grnRepo, taskRepo, auditRepo, workflowService, assetsService, dataSource) {
        this.prRepo = prRepo;
        this.poRepo = poRepo;
        this.grnRepo = grnRepo;
        this.taskRepo = taskRepo;
        this.auditRepo = auditRepo;
        this.workflowService = workflowService;
        this.assetsService = assetsService;
        this.dataSource = dataSource;
    }
    async logAudit(userId, action, entityType, entityId, newValues) {
        const log = this.auditRepo.create({
            userId,
            action,
            entityType,
            entityId,
            newValues,
        });
        await this.auditRepo.save(log);
    }
    async createRequest(data, requesterId) {
        const totalAmount = data.quantity * data.estimatedCost;
        const pr = this.prRepo.create({
            ...data,
            requesterId,
            status: procurement_request_entity_1.ProcurementStatus.PENDING,
        });
        const savedPr = (await this.prRepo.save(pr));
        await this.logAudit(requesterId, 'CREATE_PR', 'ProcurementRequest', savedPr.id, savedPr);
        const hasWorkflows = await this.workflowService.generateApprovalTasks('ProcurementRequest', savedPr.id, totalAmount);
        if (!hasWorkflows) {
        }
        return savedPr;
    }
    async approveTask(taskId, userId, comments) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, { where: { id: userId } });
            const task = await manager.findOne(approval_task_entity_1.ApprovalTask, {
                where: { id: taskId },
            });
            if (!task || !task.isCurrent)
                throw new common_1.BadRequestException('Task not found or not currently active');
            const isAuthorized = task.approverId === userId ||
                (task.approverRoleId && user?.roleId === task.approverRoleId);
            if (!isAuthorized) {
                throw new common_1.BadRequestException('You do not have authority to approve this task');
            }
            task.status = approval_task_entity_1.ApprovalStatus.APPROVED;
            task.comments = comments;
            task.isCurrent = false;
            await manager.save(task);
            const nextTask = await manager.findOne(approval_task_entity_1.ApprovalTask, {
                where: {
                    targetEntityType: task.targetEntityType,
                    targetEntityId: task.targetEntityId,
                    sequence: task.sequence + 1,
                    status: approval_task_entity_1.ApprovalStatus.PENDING,
                },
            });
            if (nextTask) {
                nextTask.isCurrent = true;
                await manager.save(nextTask);
                await this.logAudit(userId, 'APPROVE_TASK_STEP', 'ApprovalTask', task.id, { nextSequence: nextTask.sequence });
            }
            else {
                await this.finalizeApproval(task.targetEntityId, userId, manager);
            }
            return { success: true };
        });
    }
    async finalizeApproval(prId, userId, manager) {
        const pr = await manager.findOne(procurement_request_entity_1.ProcurementRequest, {
            where: { id: prId },
        });
        pr.status = procurement_request_entity_1.ProcurementStatus.APPROVED;
        await manager.save(pr);
        await this.logAudit(userId, 'PR_FULLY_APPROVED', 'ProcurementRequest', prId);
    }
    async createPO(prId, vendorName, userId) {
        const pr = await this.prRepo.findOne({ where: { id: prId } });
        if (!pr || pr.status !== procurement_request_entity_1.ProcurementStatus.APPROVED) {
            throw new common_1.BadRequestException('PR must be approved to create PO');
        }
        const po = this.poRepo.create({
            poNumber: `PO-${Date.now()}`,
            requestId: prId,
            vendorName,
            totalAmount: pr.quantity * pr.estimatedCost,
            status: purchase_order_entity_1.POStatus.ISSUED,
            createdById: userId,
        });
        const savedPo = await this.poRepo.save(po);
        pr.status = procurement_request_entity_1.ProcurementStatus.ORDERED;
        await this.prRepo.save(pr);
        await this.logAudit(userId, 'CREATE_PO', 'PurchaseOrder', savedPo.id, savedPo);
        return savedPo;
    }
    async confirmReceipt(poId, quantity, notes, userId) {
        return this.dataSource.transaction(async (manager) => {
            const po = await manager.findOne(purchase_order_entity_1.PurchaseOrder, {
                where: { id: poId },
                relations: ['request'],
            });
            if (!po)
                throw new common_1.NotFoundException('PO not found');
            const grn = manager.create(goods_receipt_entity_1.GoodsReceipt, {
                grnNumber: `GRN-${Date.now()}`,
                poId: poId,
                receivedQuantity: quantity,
                receivedById: userId,
                notes,
            });
            const savedGrn = await manager.save(grn);
            await this.logAudit(userId, 'RECEIVE_GOODS', 'GoodsReceipt', savedGrn.id, savedGrn);
            const totalReceived = await manager
                .createQueryBuilder(goods_receipt_entity_1.GoodsReceipt, 'grn')
                .where('grn.poId = :poId', { poId })
                .select('SUM(grn.receivedQuantity)', 'sum')
                .getRawOne();
            if (Number(totalReceived.sum) >= po.request.quantity) {
                po.status = purchase_order_entity_1.POStatus.COMPLETED;
                await manager.save(po);
                po.request.status = procurement_request_entity_1.ProcurementStatus.RECEIVED;
                await manager.save(po.request);
            }
            await this.autoCreateAssets(savedGrn, po.request, userId, manager);
            return savedGrn;
        });
    }
    async autoCreateAssets(grn, pr, userId, manager) {
        for (let i = 0; i < grn.receivedQuantity; i++) {
            const assetData = {
                assetTag: `AST-${Date.now().toString(36).toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
                name: pr.itemName,
                category: pr.category,
                status: 'available',
                purchaseDate: grn.receivedDate,
                purchaseCost: pr.estimatedCost,
                vendor: pr.item?.vendor,
                notes: `Auto-created from GRN ${grn.grnNumber}. PR #${pr.id}`,
            };
            await this.assetsService.create(assetData, manager);
        }
        grn.assetsCreated = true;
        await manager.save(grn);
    }
    async findAllRequests() {
        return this.prRepo.find({
            relations: ['requester', 'approver'],
            order: { createdAt: 'DESC' },
        });
    }
    async findAllRules() {
        return this.prRepo.manager.find('WorkflowRule', {
            order: { minAmount: 'ASC' },
        });
    }
    async createRule(data) {
        const rule = this.prRepo.manager.create('WorkflowRule', data);
        return this.prRepo.manager.save(rule);
    }
};
exports.ProcurementService = ProcurementService;
exports.ProcurementService = ProcurementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(procurement_request_entity_1.ProcurementRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_order_entity_1.PurchaseOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(goods_receipt_entity_1.GoodsReceipt)),
    __param(3, (0, typeorm_1.InjectRepository)(approval_task_entity_1.ApprovalTask)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        workflow_service_1.WorkflowService,
        assets_service_1.AssetsService,
        typeorm_2.DataSource])
], ProcurementService);
//# sourceMappingURL=procurement.service.js.map