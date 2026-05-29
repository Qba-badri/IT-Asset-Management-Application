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
var WorkflowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workflow_rule_entity_1 = require("../entities/workflow-rule.entity");
const approval_task_entity_1 = require("../entities/approval-task.entity");
let WorkflowService = WorkflowService_1 = class WorkflowService {
    constructor(ruleRepo, taskRepo) {
        this.ruleRepo = ruleRepo;
        this.taskRepo = taskRepo;
        this.logger = new common_1.Logger(WorkflowService_1.name);
    }
    async findMatchingRule(type, amount) {
        return this.ruleRepo
            .createQueryBuilder('rule')
            .where('rule.type = :type', { type })
            .andWhere('rule.isActive = true')
            .andWhere('rule.minAmount <= :amount', { amount })
            .orderBy('rule.minAmount', 'DESC')
            .getOne();
    }
    async generateApprovalTasks(entityType, entityId, amount) {
        const rule = await this.findMatchingRule(workflow_rule_entity_1.WorkflowRuleType.PROCUREMENT, amount);
        if (!rule) {
            this.logger.warn(`No approval rule found for ${entityType} #${entityId} with amount ${amount}`);
            return false;
        }
        const tasks = [];
        for (const step of rule.steps) {
            const task = this.taskRepo.create({
                targetEntityType: entityType,
                targetEntityId: entityId,
                sequence: step.sequence,
                status: approval_task_entity_1.ApprovalStatus.PENDING,
                isCurrent: step.sequence === 1,
            });
            if (step.approverType === 'role') {
                task.approverRoleId = step.approverId;
            }
            else if (step.approverType === 'user') {
                task.approverId = step.approverId;
            }
            tasks.push(task);
        }
        await this.taskRepo.save(tasks);
        return true;
    }
    async getPendingTasks(userId, roleId) {
        return this.taskRepo.find({
            where: [
                { approverId: userId, status: approval_task_entity_1.ApprovalStatus.PENDING, isCurrent: true },
                {
                    approverRoleId: roleId,
                    status: approval_task_entity_1.ApprovalStatus.PENDING,
                    isCurrent: true,
                },
            ],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.WorkflowService = WorkflowService;
exports.WorkflowService = WorkflowService = WorkflowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workflow_rule_entity_1.WorkflowRule)),
    __param(1, (0, typeorm_1.InjectRepository)(approval_task_entity_1.ApprovalTask)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WorkflowService);
//# sourceMappingURL=workflow.service.js.map