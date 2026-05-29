---
description: Creates a database seeder for a TypeORM Entity populated with realistic, enterprise-grade dummy data and handles foreign key relationships safely.
---

Create a database seeder for the specified TypeORM Entity.

Create an array of at least 10 realistic, enterprise-grade mock data records (e.g., real device models, standard department names). Do not use "test" or "foo".

Write an injection script that checks if the records exist before inserting them to prevent duplicate key errors.

Handle foreign key relationships by allowing the seeder to accept related entity IDs as parameters.