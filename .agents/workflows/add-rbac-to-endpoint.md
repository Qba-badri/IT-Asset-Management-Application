---
description: Secures a NestJS controller endpoint using JWT authentication and custom Role-Based Access Control (RBAC) decorators.
---

Secure a specified NestJS controller endpoint using Role-Based Access Control.

Add the @UseGuards(JwtAuthGuard, RolesGuard) decorators.

Add the custom @Roles() decorator and specify the required enterprise roles (e.g., Roles.IT_ADMIN, Roles.MANAGER).

Verify that the requested data context matches the user's allowed department scope.