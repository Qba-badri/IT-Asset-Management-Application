---
description: Generates a complete NestJS feature module including TypeORM Entity, DTOs with validation, Service, Controller with RBAC guards, and standard CRUD operations.
---

Generate a complete NestJS feature module. Follow these exact steps:

Create a TypeORM Entity in the correct directory with standard columns (id, createdAt, updatedAt, deletedAt).

Create Create and Update DTOs using class-validator decorators.

Generate the Module, Service, and Controller files.

Inject the Entity Repository into the Service.

Add @UseGuards(JwtAuthGuard, RolesGuard) to the Controller and create standard CRUD endpoints.