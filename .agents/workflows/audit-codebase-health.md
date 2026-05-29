---
description: Scans the current project directories to verify strict adherence to Domain-Driven Design, NestJS/React best practices, and enterprise security standards.
---

Run a comprehensive Codebase Health and Architecture Audit on the current workspace. Analyze the directory structure and recent file changes against our enterprise standards. 

Please verify the following 5 pillars and provide a Pass/Fail diagnostic report:

1. Folder Architecture (Domain-Driven Design):
- Verify that backend files are grouped by feature in `src/modules/` and not globally by type.
- Verify that frontend business logic is isolated in `src/features/` and UI primitives are in `src/components/ui/`.

2. Backend Integrity (NestJS & TypeORM):
- Scan for any raw SQL queries (flag them as failures).
- Ensure all Controller endpoints have DTOs for payload validation.
- Verify that Entities are using `@DeleteDateColumn` for soft deletes instead of hard deletes.

3. Frontend Standards (React):
- Scan for standard CSS files or inline styles (flag as failures; enforce TailwindCSS).
- Ensure components are using Radix UI primitives where applicable.
- Check for excessive global state where local context would suffice.

4. Security & RBAC:
- Verify that backend controllers are protected by standard JWT and Roles guards. 
- Flag any endpoints missing explicit access control unless intentionally marked public.

5. Code Quality:
- Scan for the use of the `any` type in TypeScript files.
- Identify any functions or components exceeding 200 lines of code that should be refactored.

Output a structured report titled "Antigravity Codebase Audit Report". List any violations found with the exact file path, line number, and the required command or code block to fix the issue.