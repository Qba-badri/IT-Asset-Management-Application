import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Role } from '../src/entities/role.entity';

/**
 * Security & RBAC e2e suite.
 *
 * Prerequisites (see docs/UAT_RUNBOOK.md):
 *   - a DISPOSABLE Postgres database (never a shared one)
 *   - migrations applied:   DB_NAME=<disposable> npm run migration:run
 *   - roles/permissions:    DB_NAME=<disposable> NODE_ENV=development npm run seed
 *   - run with:             DB_NAME=<disposable> npm run test:e2e
 *
 * The suite provisions its own throwaway users and removes them afterwards.
 * The test password below is a fixture for the disposable DB only.
 */

const ADMIN_EMAIL = 'e2e-admin@itam-test.local';
const EMPLOYEE_EMAIL = 'e2e-employee@itam-test.local';
const EMPLOYEE2_EMAIL = 'e2e-employee2@itam-test.local';
const TEST_PASSWORD = 'E2e-only#Passw0rd';

describe('Security & RBAC (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let employeeToken: string;
  let employee2Token: string;
  let employee2Id: number;
  const createdUserIds: number[] = [];

  // Fully detach and delete throwaway users (audit/history rows hold FKs)
  const purgeUsers = async (ids: number[]) => {
    await dataSource.query(
      'DELETE FROM audit_events WHERE "actorId" = ANY($1)',
      [ids],
    );
    await dataSource.query(
      'UPDATE asset_history SET performed_by_id = NULL WHERE performed_by_id = ANY($1)',
      [ids],
    );
    await dataSource.getRepository(User).delete(ids);
  };

  const login = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    return res.body;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Keep identical to the production pipe in src/main.ts (F-17)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    const roleRepo = dataSource.getRepository(Role);
    const userRepo = dataSource.getRepository(User);
    const adminRole = await roleRepo.findOneBy({ name: 'Admin' });
    const employeeRole = await roleRepo.findOneBy({ name: 'Standard User' });
    if (!adminRole || !employeeRole) {
      throw new Error(
        'Seeded roles missing — run "npm run seed" against the test database first.',
      );
    }
    // Remove leftovers from a previously aborted run (idempotent setup)
    const leftovers = await userRepo.find({
      where: [
        { email: ADMIN_EMAIL },
        { email: EMPLOYEE_EMAIL },
        { email: EMPLOYEE2_EMAIL },
      ],
      withDeleted: true,
    });
    if (leftovers.length) {
      const ids = leftovers.map((u) => u.id);
      await purgeUsers(ids);
    }

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const mkUser = async (email: string, role: Role) => {
      const user = await userRepo.save(
        userRepo.create({
          email,
          passwordHash,
          firstName: 'E2E',
          lastName: 'User',
          role,
          isActive: true,
          isVerified: true,
        }),
      );
      createdUserIds.push(user.id);
      return user;
    };
    await mkUser(ADMIN_EMAIL, adminRole);
    await mkUser(EMPLOYEE_EMAIL, employeeRole);
    const emp2 = await mkUser(EMPLOYEE2_EMAIL, employeeRole);
    employee2Id = emp2.id;

    adminToken = (await login(ADMIN_EMAIL)).token;
    employeeToken = (await login(EMPLOYEE_EMAIL)).token;
    employee2Token = (await login(EMPLOYEE2_EMAIL)).token;
  }, 60000);

  afterAll(async () => {
    if (dataSource?.isInitialized && createdUserIds.length) {
      // login/audit events reference the users via FK — remove them first
      await purgeUsers(createdUserIds);
    }
    await app?.close();
  });

  describe('Health endpoint (F-08)', () => {
    it('GET /health returns 200 without authentication', async () => {
      const res = await request(app.getHttpServer()).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', database: 'up' });
    });

    it('health response leaks no configuration', async () => {
      const res = await request(app.getHttpServer()).get('/health');
      expect(JSON.stringify(res.body)).not.toMatch(
        /password|secret|host|connection/i,
      );
    });
  });

  describe('Authentication basics', () => {
    it('rejects requests without a token', async () => {
      await request(app.getHttpServer()).get('/assets').expect(401);
    });

    it('rejects a forged token', async () => {
      await request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', 'Bearer not.a.real.token')
        .expect(401);
    });

    it('login returns role and permissions', async () => {
      const body = await login(ADMIN_EMAIL);
      expect(body.user.role.name).toBe('Admin');
      expect(body.user.permissions.length).toBeGreaterThan(0);
    });
  });

  describe('Anti-enumeration (F-11)', () => {
    it('forgot-password responds identically for known and unknown emails', async () => {
      const known = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: EMPLOYEE_EMAIL });
      const unknown = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'no-such-user@itam-test.local' });
      expect(known.status).toBe(unknown.status);
      expect(known.body).toEqual(unknown.body);
      // and the OTP is never in the response
      expect(JSON.stringify(known.body)).not.toMatch(/\b\d{6}\b/);
    });
  });

  describe('RBAC 403 matrix (F-04/F-05): employee denied restricted operations', () => {
    const cases: Array<[string, string, any]> = [
      ['post', '/masters/brands', { name: 'E2E Brand' }],
      ['put', '/masters/brands/1', { name: 'X' }],
      ['delete', '/masters/brands/1', undefined],
      ['post', '/masters/vendors', { name: 'E2E Vendor' }],
      ['delete', '/masters/vendors/1', undefined],
      ['post', '/masters/plans', { name: 'E2E Plan', vendorId: 1 }],
      ['post', '/masters/lookups', { type: 'T', label: 'L', value: 'v' }],
      [
        'post',
        '/api/stock/initialize',
        { catalogItemId: 1, locationId: 1, quantity: 5 },
      ],
      [
        'post',
        '/api/stock/adjust',
        { catalogItemId: 1, locationId: 1, newQuantity: 5, reason: 'x' },
      ],
      ['post', '/users/sync/azure', {}],
      ['post', '/api/issue', {}],
      ['post', '/api/return', {}],
      ['post', '/api/transfer', {}],
      ['post', '/api/write-off', {}],
      ['post', '/api/departments', { name: 'E2E Dept' }],
      ['put', '/api/departments/1', { name: 'X' }],
      ['post', '/api/asset-units', {}],
      ['put', '/api/asset-units/1', {}],
      ['post', '/assets', { assetTag: 'X-1', name: 'X' }],
      ['delete', '/assets/1', undefined],
      ['post', '/users', { email: 'x@y.z' }],
      ['delete', '/users/1', undefined],
      ['post', '/rbac/roles', { name: 'Hacker Role', permissionIds: [1] }],
    ];

    it.each(cases)('employee %s %s → 403', async (method, url, body) => {
      const res = await (request(app.getHttpServer()) as any)
        [method](url)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(body);
      expect(res.status).toBe(403);
    });

    it('employee GET /rbac/roles → 403', async () => {
      await request(app.getHttpServer())
        .get('/rbac/roles')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    it('employee GET /api/stock → 403 (inventory.view required)', async () => {
      await request(app.getHttpServer())
        .get('/api/stock')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    it('employee GET /api/reports/ledger → 403 (reports.view required)', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/ledger')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });
  });

  describe('RBAC positive checks: admin allowed', () => {
    let brandId: number;

    it('admin can view roles', async () => {
      await request(app.getHttpServer())
        .get('/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('admin can create master data', async () => {
      const res = await request(app.getHttpServer())
        .post('/masters/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `E2E Brand ${Date.now()}` });
      expect([200, 201]).toContain(res.status);
      brandId = res.body.id;
    });

    it('admin can delete master data', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/masters/brands/${brandId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 204]).toContain(res.status);
    });

    it('admin can list users, stock, and reports', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/reports/dashboard-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('IDOR / user-data access', () => {
    it('employee cannot read another user by id', async () => {
      await request(app.getHttpServer())
        .get(`/users/${employee2Id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    it('employee cannot update another user', async () => {
      await request(app.getHttpServer())
        .put(`/users/${employee2Id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ firstName: 'Hacked', roleId: 1 })
        .expect(403);
    });

    it('employee can read their own profile without passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(EMPLOYEE_EMAIL);
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('profile update cannot escalate role or change email', async () => {
      const res = await request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          firstName: 'Renamed',
          email: 'hijack@itam-test.local',
          roleId: 1,
          role: { id: 1 },
        });
      expect(res.status).toBe(200);
      const self = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(self.body.email).toBe(EMPLOYEE_EMAIL); // email unchanged
      expect(self.body.role?.name).toBe('Standard User'); // role unchanged
      // employee2 untouched
      const other = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${employee2Token}`);
      expect(other.body.email).toBe(EMPLOYEE2_EMAIL);
    });
  });

  describe('Audit identity integrity (F-13)', () => {
    it('asset creation records the authenticated user, ignoring client performedBy', async () => {
      const tag = `E2E-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'E2E Asset', assetTag: tag, category: 'Laptop', performedBy: 99999 });
      expect([200, 201]).toContain(res.status);
      const assetId = res.body.id;

      const history = await request(app.getHttpServer())
        .get(`/assets/${assetId}/history`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(history.status).toBe(200);
      expect(JSON.stringify(history.body)).not.toContain('99999');

      await request(app.getHttpServer())
        .delete(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });
});
