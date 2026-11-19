import { Test, type TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DbService } from './db/db.service.js';

describe('AppController', () => {
  let appController: AppController;
  const db = { withContext: vi.fn() };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: DbService, useValue: db }],
    }).compile();
    appController = app.get<AppController>(AppController);
  });

  it('root "Hello World!" qaytaradi', () => {
    expect(appController.getHello()).toBe('Hello World!');
  });

  it("health: baza javob bersa ok, bermasa 503 (ichki xato matnisiz)", async () => {
    db.withContext.mockResolvedValueOnce(undefined);
    await expect(appController.health()).resolves.toEqual({ status: 'ok' });
    db.withContext.mockRejectedValueOnce(new Error('connection refused: secret host'));
    await expect(appController.health()).rejects.toMatchObject({ response: { status: 'db_unavailable' } });
  });
});
