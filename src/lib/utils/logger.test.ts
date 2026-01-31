import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from './logger';

describe('Logger', () => {
  // Save original console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    // Mock console methods
    console.debug = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();

    // Clear logs before each test
    logger.clearLogs();
  });

  afterEach(() => {
    // Restore console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it('should log messages with different levels', () => {
    // Log messages with different levels
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    // Check that console methods were called
    expect(console.debug).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();

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

    // Check that console was called with data
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('INFO'),
      expect.stringContaining('Info with data'),
      data
    );

    // Check that data was stored
    const logs = logger.getLogs();
    expect(logs[0].data).toBe(data);
  });

  it('should create child loggers with prefixes', () => {
    // Create a child logger
    const childLogger = logger.createChild('test');

    // Log a message with the child logger
    childLogger.info('Child logger message');

    // Check that console was called with prefix
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('INFO'),
      expect.stringContaining('[test] Child logger message'),
      expect.anything()
    );

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

    // Check that console was called with nested prefix
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('INFO'),
      expect.stringContaining('[parent:child] Grandchild logger message'),
      expect.anything()
    );
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
    // Import the API logger
    const { apiLogger } = require('./logger');

    // Log a message with the API logger
    apiLogger.info('API logger message');

    // Check that console was called with API prefix
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('INFO'),
      expect.stringContaining('[api] API logger message'),
      expect.anything()
    );
  });
});