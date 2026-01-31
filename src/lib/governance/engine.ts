import { AppDispatch } from '../../store';
import { triggerGate } from '../../store/slices/governance.slice';

// Simple regex-based patterns for MVP
const PATTERNS = {
  PII: /\b(\d{3}-\d{2}-\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/, // SSN or Email
  SECRET: /(api_key|secret|password|token).{0,20}['"][a-zA-Z0-9]{10,}['"]/i, // Basic key detection
  DESTRUCTIVE: /\b(drop table|delete from|rm -rf|shutdown)\b/i
};

export class GovernanceEngine {
  static analyzeStream(chunk: string, dispatch: AppDispatch): void {
    // 1. Check for PII
    if (PATTERNS.PII.test(chunk)) {
      dispatch(triggerGate({
        id: `gate-${Date.now()}`,
        type: 'pii',
        severity: 'high',
        message: 'Potential PII detected in output stream.'
      }));
      return; // Stop processing to prevent leak
    }

    // 2. Check for Secrets
    if (PATTERNS.SECRET.test(chunk)) {
      dispatch(triggerGate({
        id: `gate-${Date.now()}`,
        type: 'security',
        severity: 'critical',
        message: 'Potential API Key or Secret detected.'
      }));
      return;
    }

    // 3. Check for Destructive Commands
    if (PATTERNS.DESTRUCTIVE.test(chunk)) {
      dispatch(triggerGate({
        id: `gate-${Date.now()}`,
        type: 'security',
        severity: 'critical',
        message: 'Destructive command pattern detected.'
      }));
    }
  }

  static enforceBudget(dispatch: AppDispatch, currentCost: number, limit: number = 5.00): boolean {
    if (currentCost > limit) {
      dispatch(triggerGate({
        id: `budget-${Date.now()}`,
        type: 'budget',
        severity: 'medium',
        message: `Cost limit exceeded ($${limit.toFixed(2)})`
      }));
      return false;
    }
    return true;
  }
}
