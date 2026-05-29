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
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../entities/role.entity");
const permission_entity_1 = require("../entities/permission.entity");
let RbacService = class RbacService {
    constructor(roleRepository, permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }
    async findAllRoles() {
        return this.roleRepository.find({ relations: ['permissions'] });
    }
    async findOneRole(id) {
        const role = await this.roleRepository.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    async createRole(name, description, permissionIds) {
        const permissions = permissionIds.length > 0
            ? await this.permissionRepository.find({
                where: { id: (0, typeorm_2.In)(permissionIds) },
            })
            : [];
        const role = this.roleRepository.create({
            name,
            description,
            permissions,
        });
        return this.roleRepository.save(role);
    }
    async updateRole(id, name, description, permissionIds) {
        const role = await this.findOneRole(id);
        role.name = name;
        role.description = description;
        if (permissionIds && permissionIds.length > 0) {
            role.permissions = await this.permissionRepository.find({
                where: { id: (0, typeorm_2.In)(permissionIds) },
            });
        }
        else {
            role.permissions = [];
        }
        return this.roleRepository.save(role);
    }
    async deleteRole(id) {
        const role = await this.findOneRole(id);
        await this.roleRepository.remove(role);
    }
    async findAllPermissions() {
        return this.permissionRepository.find();
    }
    async findOnePermission(id) {
        const permission = await this.permissionRepository.findOne({
            where: { id },
        });
        if (!permission)
            throw new common_1.NotFoundException('Permission not found');
        return permission;
    }
    async createPermission(slug, module, description) {
        const permission = this.permissionRepository.create({
            slug,
            module,
            description,
        });
        return this.permissionRepository.save(permission);
    }
    async updatePermission(id, slug, module, description) {
        const permission = await this.findOnePermission(id);
        permission.slug = slug;
        permission.module = module;
        permission.description = description;
        return this.permissionRepository.save(permission);
    }
    async deletePermission(id) {
        const permission = await this.findOnePermission(id);
        await this.permissionRepository.remove(permission);
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RbacService);
//# sourceMappingURL=rbac.service.js.map