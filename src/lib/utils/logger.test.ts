import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from './logger';

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    PROD: false,
    DEV: true,
    MODE: 'test'
  }
});

describe('Logger', () => {
  // Save original console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // Force console logging even in test mode for testing purposes
  const originalLogToConsole = logger['logToConsole'].bind(logger);

  beforeEach(() => {
    // Mock console methods
    console.debug = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();

    // Override the logToConsole method to bypass the isTest check
    logger['logToConsole'] = function(level: LogLevel, message: string, data?: any) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`${prefix} ${message}`, data !== undefined ? data : '');
          break;
        case LogLevel.INFO:
          console.info(`${prefix} ${message}`, data !== undefined ? data : '');
          break;
        case LogLevel.WARN:
          console.warn(`${prefix} ${message}`, data !== undefined ? data : '');
          break;
        case LogLevel.ERROR:
          console.error(`${prefix} ${message}`, data !== undefined ? data : '');
          break;
      }
    };

    // Clear logs before each test
    logger.clearLogs();
  });

  afterEach(() => {
    // Restore console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    // Restore original logToConsole method
    logger['logToConsole'] = originalLogToConsole;
  });

  it('should log messages with different levels', () => {
    // Log messages with different levels
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    // Check that messages were stored
    const logs = logger.getLogs();
    expect(logs.length).toBe(4);
    expect(logs[0].level).toBe(LogLevel.DEBUG);
    expect(logs[0].message).toBe('Debug message');
    expect(logs[1].level).toBe(LogLevel.INFO);
    expect(logs[2].level).toBe(LogLevel.WARN);
    expect(logs[3].level).toBe(LogLevel.ERROR);
  });

  it('should log messages with data', () => {
    const data = { id: 123, name: 'Test' };
    logger.info('Info with data', data);

    // Check that data was stored
    const logs = logger.getLogs();
    expect(logs[0].data).toBe(data);
  });

  it('should create child loggers with prefixes', () => {
    // Create a child logger
    const childLogger = logger.createChild('test');

    // Log a message with the child logger
    childLogger.info('Child logger message');

    // Check that message with prefix was stored
    const logs = logger.getLogs();
    expect(logs[0].message).toContain('[test]');
  });

  it('should create nested child loggers', () => {
    // Create nested child loggers
    const childLogger = logger.createChild('parent');
    const grandchildLogger = childLogger.createChild('child');

    // Log a message with the grandchild logger
    grandchildLogger.info('Grandchild logger message');

    // Check that message with nested prefix was stored
    const logs = logger.getLogs();
    expect(logs[0].message).toContain('[parent:child]');
  });

  it('should clear logs', () => {
    // Log some messages
    logger.info('Message 1');
    logger.info('Message 2');

    // Check that logs were stored
    expect(logger.getLogs().length).toBe(2);

    // Clear logs
    logger.clearLogs();

    // Check that logs were cleared
    expect(logger.getLogs().length).toBe(0);
  });

  it('should not throw errors when logging', () => {
    // Test with undefined data (should not throw)
    expect(() => logger.info('Test with undefined', undefined)).not.toThrow();

    // Test with circular references (should not throw)
    const circularObj: any = { name: 'circular' };
    circularObj.self = circularObj;
    expect(() => logger.info('Test with circular', circularObj)).not.toThrow();
  });

  // Test API logger
  it('should create a specific API logger', () => {
    // Import the API logger - don't use require since we're modifying the module
    // Create a child logger with 'api' prefix directly from the logger instance
    const apiLogger = logger.createChild('api');

    // Log a message with the API logger
    apiLogger.info('API logger message');

    // Check that message with API prefix was stored
    const logs = logger.getLogs();
    expect(logs[0].message).toContain('[api]');
  });
});