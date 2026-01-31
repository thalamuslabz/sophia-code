import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = {
        status: 'ok',
        timestamp: '2026-01-31T00:00:00.000Z',
        version: '0.1.0',
      };

      jest.spyOn(appService, 'getHealth').mockImplementation(() => result);

      expect(appController.getHealth()).toBe(result);
      expect(appService.getHealth).toHaveBeenCalled();
    });
  });
});