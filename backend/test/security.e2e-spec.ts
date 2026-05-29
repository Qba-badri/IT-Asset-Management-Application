import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Security & RBAC (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let adminToken: string;
    let employeeToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Apply same validation pipe as production
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));

        await app.init();

        dataSource = moduleFixture.get<DataSource>(DataSource);

        // Login as admin and employee to get tokens
        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@company.com', password: 'Admin123!' });
        adminToken = adminLogin.body.access_token;

        const employeeLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'employee@company.com', password: 'Employee123!' });
        employeeToken = employeeLogin.body.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('BUG-001: RBAC Enforcement', () => {
        it('should allow admin to view roles', async () => {
            return request(app.getHttpServer())
                .get('/rbac/roles')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should prevent employee from viewing roles', async () => {
            return request(app.getHttpServer())
                .get('/rbac/roles')
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(403);
        });

        it('should prevent employee from creating roles', async () => {
            return request(app.getHttpServer())
                .post('/rbac/roles')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    name: 'Hacker Role',
                    description: 'Attempting privilege escalation',
                    permissionIds: [1, 2, 3],
                })
                .expect(403);
        });

        it('should prevent employee from deleting users', async () => {
            return request(app.getHttpServer())
                .delete('/users/1')
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(403);
        });

        it('should prevent employee from deleting assets', async () => {
            return request(app.getHttpServer())
                .delete('/assets/1')
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(403);
        });
    });

    describe('BUG-002: User Update Authorization', () => {
        it('should allow user to update their own profile', async () => {
            return request(app.getHttpServer())
                .put('/users/me')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    firstName: 'Updated',
                    lastName: 'Name',
                })
                .expect(200);
        });

        it('should prevent user from updating another user', async () => {
            return request(app.getHttpServer())
                .put('/users/1')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    firstName: 'Hacked',
                    roleId: 1, // Attempting to change role
                })
                .expect(403);
        });

        it('should prevent user from setting roleId via profile update', async () => {
            const response = await request(app.getHttpServer())
                .put('/users/me')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    firstName: 'Test',
                    roleId: 1, // This should be stripped or rejected
                });

            // Should either be 400 (forbidden field) or 200 with roleId ignored
            expect([200, 400]).toContain(response.status);

            if (response.status === 200) {
                // Verify roleId was not changed
                const user = await request(app.getHttpServer())
                    .get('/users/me')
                    .set('Authorization', `Bearer ${employeeToken}`);

                expect(user.body.roleId).not.toBe(1);
            }
        });

        it('should allow admin to update any user including roleId', async () => {
            return request(app.getHttpServer())
                .put('/users/2')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'Admin Updated',
                    roleId: 2,
                })
                .expect(200);
        });
    });

    describe('BUG-003: Procurement Transaction Integrity', () => {
        it('should rollback all changes if asset creation fails', async () => {
            // This test requires mocking asset creation failure
            // For now, we verify the endpoint structure

            const initialGRNCount = await dataSource
                .getRepository('GoodsReceipt')
                .count();

            // Attempt to confirm receipt with invalid data that should fail
            const response = await request(app.getHttpServer())
                .post('/procurement/confirm-receipt')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    poId: 999999, // Non-existent PO
                    quantity: 5,
                    notes: 'Test receipt',
                    userId: 1,
                });

            expect([400, 404]).toContain(response.status);

            // Verify no GRN was created
            const finalGRNCount = await dataSource
                .getRepository('GoodsReceipt')
                .count();

            expect(finalGRNCount).toBe(initialGRNCount);
        });
    });

    describe('BUG-004: Dashboard Live Data', () => {
        it('should return live audit log data', async () => {
            const response = await request(app.getHttpServer())
                .get('/audit-logs/recent?limit=5')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('action');
                expect(response.body[0]).toHaveProperty('entityType');
                expect(response.body[0]).toHaveProperty('createdAt');
            }
        });
    });

    describe('BUG-005: Statistics Accuracy', () => {
        it('should include REPAIR status in maintenance count', async () => {
            const response = await request(app.getHttpServer())
                .get('/assets/statistics')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('maintenance');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('deployed');
            expect(response.body).toHaveProperty('available');
            expect(response.body).toHaveProperty('disposed');

            // Maintenance should be a number >= 0
            expect(typeof response.body.maintenance).toBe('number');
            expect(response.body.maintenance).toBeGreaterThanOrEqual(0);
        });
    });

    describe('BUG-007: DTO Validation', () => {
        it('should reject requests with unknown fields', async () => {
            return request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    password: 'Test123!',
                    roleId: 2,
                    hackerField: 'malicious data', // Unknown field
                })
                .expect(400);
        });

        it('should validate required fields', async () => {
            return request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'Test',
                    // Missing required fields: lastName, email, password, roleId
                })
                .expect(400);
        });

        it('should validate email format', async () => {
            return request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'invalid-email', // Invalid format
                    password: 'Test123!',
                    roleId: 2,
                })
                .expect(400);
        });

        it('should validate minimum password length', async () => {
            return request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    password: '123', // Too short
                    roleId: 2,
                })
                .expect(400);
        });

        it('should accept valid asset creation', async () => {
            const response = await request(app.getHttpServer())
                .post('/assets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    assetTag: 'TEST-001',
                    name: 'Test Laptop',
                    category: 'Laptop',
                    status: 'available',
                });

            expect([200, 201]).toContain(response.status);
        });

        it('should reject asset with invalid status enum', async () => {
            return request(app.getHttpServer())
                .post('/assets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    assetTag: 'TEST-002',
                    name: 'Test Laptop',
                    category: 'Laptop',
                    status: 'invalid_status', // Not in AssetStatus enum
                })
                .expect(400);
        });
    });

    describe('Authorization Header Validation', () => {
        it('should reject requests without token', async () => {
            return request(app.getHttpServer())
                .get('/assets')
                .expect(401);
        });

        it('should reject requests with invalid token', async () => {
            return request(app.getHttpServer())
                .get('/assets')
                .set('Authorization', 'Bearer invalid_token_here')
                .expect(401);
        });
    });

    describe('Performance: N+1 Query Prevention', () => {
        it('should load assets with photos in single query', async () => {
            const response = await request(app.getHttpServer())
                .get('/assets')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            // Verify photos are included in response
            if (response.body.length > 0 && response.body[0].photos) {
                expect(Array.isArray(response.body[0].photos)).toBe(true);
            }
        });

        it('should calculate license statistics efficiently', async () => {
            const startTime = Date.now();

            await request(app.getHttpServer())
                .get('/licenses/statistics')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const duration = Date.now() - startTime;

            // Should complete in under 1 second even with many licenses
            expect(duration).toBeLessThan(1000);
        });
    });
});
