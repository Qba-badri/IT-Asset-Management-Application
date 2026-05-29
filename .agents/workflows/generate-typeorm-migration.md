---
description: Analyzes recent Entity schema changes and generates a standardized TypeORM migration file with raw PostgreSQL up() and down() queries.
---

Generate a TypeORM migration based on recent Entity changes. Follow these steps:

Analyze the requested Entity schema changes.

Write the raw PostgreSQL queries required for the up() and down() methods.

Output the code in a new TypeScript migration file that matches standard TypeORM formatting. Ensure the down() method perfectly reverses the up() method.