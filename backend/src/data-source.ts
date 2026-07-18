import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * TypeORM CLI DataSource — used by the migration scripts in package.json
 * (migration:run / migration:revert / migration:show / migration:generate).
 *
 * The runtime application (app.module.ts) builds its own options via
 * ConfigService; keep the entity list in both places in sync by using the
 * glob below, which picks up every entity in src/entities.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        'Set it in backend/.env (see .env.example).',
    );
  }
  return value;
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: required('DB_HOST'),
  port: parseInt(required('DB_PORT'), 10),
  username: required('DB_USERNAME'),
  password: required('DB_PASSWORD'),
  database: required('DB_NAME'),
  entities: [__dirname + '/entities/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: false,
});

export default AppDataSource;
