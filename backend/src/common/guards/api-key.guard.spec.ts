import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { createMock } from '@golevelup/ts-jest';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when API key is valid', () => {
      // Mock ConfigService to return a valid API key
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'API_KEY') {
          return 'test-api-key';
        }
        return undefined;
      });

      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            header: jest.fn().mockReturnValue('test-api-key'),
          }),
        }),
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should bypass validation in development mode if no API key is configured', () => {
      // Mock ConfigService to return development env and no API key
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'NODE_ENV') {
          return 'development';
        }
        if (key === 'API_KEY') {
          return undefined;
        }
        return undefined;
      });

      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            header: jest.fn().mockReturnValue(undefined),
          }),
        }),
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException when API key is invalid', () => {
      // Mock ConfigService to return a valid API key
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'API_KEY') {
          return 'correct-api-key';
        }
        return undefined;
      });

      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            header: jest.fn().mockReturnValue('incorrect-api-key'),
          }),
        }),
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when API key is missing', () => {
      // Mock ConfigService to return a valid API key
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'API_KEY') {
          return 'test-api-key';
        }
        return undefined;
      });

      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            header: jest.fn().mockReturnValue(undefined),
          }),
        }),
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});