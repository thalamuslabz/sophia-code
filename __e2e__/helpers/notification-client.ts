/**
 * Notification Client - Mock for desktop notifications in E2E tests
 */

import * as path from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const NOTIFICATION_LOG = path.join(process.env.HOME || '/tmp', '.thalamus-e2e', 'notifications.log');

interface Notification {
  title: string;
  message: string;
  timestamp: string;
  icon?: string;
}

/**
 * Mock notifier for testing - logs instead of showing real notifications
 */
export function mockNotify(notification: {
  title: string;
  message: string;
  icon?: string;
  timeout?: number;
  sound?: boolean;
}): void {
  const logDir = path.dirname(NOTIFICATION_LOG);
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  const entry: Notification = {
    title: notification.title,
    message: notification.message,
    timestamp: new Date().toISOString(),
    icon: notification.icon
  };

  const logLine = `[${entry.timestamp}] ${entry.title}: ${entry.message}\n`;
  writeFileSync(NOTIFICATION_LOG, logLine, { flag: 'a' });
}

/**
 * Get all logged notifications
 */
export function getNotificationLog(): string {
  if (!existsSync(NOTIFICATION_LOG)) {
    return '';
  }
  return readFileSync(NOTIFICATION_LOG, 'utf-8');
}

/**
 * Clear notification log
 */
export function clearNotificationLog(): void {
  if (existsSync(NOTIFICATION_LOG)) {
    writeFileSync(NOTIFICATION_LOG, '');
  }
}

/**
 * Check if notification was sent
 */
export function wasNotificationSent(title: string, message?: string): boolean {
  const log = getNotificationLog();
  if (!log.includes(title)) return false;
  if (message && !log.includes(message)) return false;
  return true;
}

/**
 * Wait for notification to appear
 */
export async function waitForNotification(
  title: string,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (wasNotificationSent(title)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}
