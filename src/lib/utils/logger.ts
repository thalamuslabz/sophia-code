/**
 * Logger utility for consistent logging across the application
 */

// Define log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Environment
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

// Configure log level based on environment
const currentLogLevel = isProduction
  ? LogLevel.ERROR
  : isDevelopment
  ? LogLevel.DEBUG
  : LogLevel.WARN;

// Should we log to console?
const enableConsoleLogging = !isProduction || isDevelopment;

interface LoggerOptions {
  enableConsole: boolean;
  minLevel: LogLevel;
  prefix?: string;
}

/**
 * Logger class for consistent logging
 */
class Logger {
  private options: LoggerOptions;
  private logStore: Array<{ level: LogLevel; message: string; data?: any; timestamp: Date }>;

  constructor(
    options: Partial<LoggerOptions> = {},
    logStore?: Array<{ level: LogLevel; message: string; data?: any; timestamp: Date }>
  ) {
    this.options = {
      enableConsole: options.enableConsole ?? enableConsoleLogging,
      minLevel: options.minLevel ?? currentLogLevel,
      prefix: options.prefix,
    };
    this.logStore = logStore ?? [];
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Error level logging
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Get all logs
   */
  getLogs() {
    return [...this.logStore];
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logStore.length = 0; // Clear the array without reassigning it
  }

  /**
   * Generic log method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // Skip logging if level is below minimum
    if (!this.shouldLog(level)) {
      return;
    }

    // Format message
    const formattedMessage = this.options.prefix
      ? `[${this.options.prefix}] ${message}`
      : message;

    // Store log
    this.logStore.push({
      level,
      message: formattedMessage,
      data,
      timestamp: new Date(),
    });

    // Log to console if enabled
    if (this.options.enableConsole && !isTest) {
      this.logToConsole(level, formattedMessage, data);
    }

    // In the future, we could add more logging destinations here:
    // - Send to error reporting service (Sentry, LogRocket, etc.)
    // - Log to file
    // - Send to analytics service
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levelPriority = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
    };

    return levelPriority[level] >= levelPriority[this.options.minLevel];
  }

  /**
   * Log to console with appropriate styling
   */
  private logToConsole(level: LogLevel, message: string, data?: any): void {
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
  }

  /**
   * Create a child logger with a prefix
   * Shares the same log store as the parent
   */
  createChild(prefix: string): Logger {
    return new Logger({
      ...this.options,
      prefix: this.options.prefix
        ? `${this.options.prefix}:${prefix}`
        : prefix,
    }, this.logStore); // Pass the same log store reference
  }
}

// Export singleton instance
export const logger = new Logger();

// Export API logger for specific API logging
export const apiLogger = logger.createChild('api');