import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const dataSource = { query: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('returns ok when the database responds', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      await expect(appController.health()).resolves.toEqual({
        status: 'ok',
        database: 'up',
      });
    });

    it('returns 503 when the database is unreachable', async () => {
      dataSource.query.mockRejectedValue(new Error('connection refused'));
      await expect(appController.health()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('exposes no secrets or error details', async () => {
      dataSource.query.mockRejectedValue(
        new Error('password authentication failed for user "x"'),
      );
      try {
        await appController.health();
        fail('expected rejection');
      } catch (err) {
        expect(JSON.stringify(err.getResponse())).not.toMatch(/password|user/);
      }
    });
  });
});
