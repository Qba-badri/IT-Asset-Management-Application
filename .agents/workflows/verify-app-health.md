---
description: Starts the backend and frontend servers, verifies PostgreSQL database connectivity via TypeORM, and monitors terminal outputs for compilation or runtime errors.
---

Run a complete startup and health check sequence for the application. Follow these steps:

1. Identify the package manager (npm, yarn, or pnpm) and start both the NestJS backend and React frontend development servers.
2. Monitor the terminal outputs to ensure successful compilation. Flag any TypeScript, ESLint, or strict-type errors that appear during the build phase.
3. Verify the TypeORM database connection logs. Confirm that it successfully connected to PostgreSQL and report if there are any unapplied database migrations.
4. Verify that both the backend and frontend are actively listening on their respective local ports.
5. Provide a concise summary report containing: 
   - Backend Status
   - Frontend Status
   - Database Connection Status
   - A bulleted list of any warnings, deprecated package notices, or errors that require immediate attention before coding begins.