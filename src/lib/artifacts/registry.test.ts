import { describe, it, expect } from 'vitest';
import { registry } from './registry';
import { PIIGate } from './gates/core';
import './index'; // Load artifacts

describe('Artifact Registry System', () => {
  it('should register core intents', () => {
    const intent = registry.get('intent.core.code-review');
    expect(intent).toBeDefined();
    expect(intent?.kind).toBe('intent');
  });

  it('should register core gates', () => {
    const gate = registry.get('gate.core.pii');
    expect(gate).toBeDefined();
    expect(gate?.kind).toBe('gate');
  });

  it('should evaluate PII gate correctly', () => {
    const result = PIIGate.evaluator({}, 'Contact me at test@example.com');
    expect(result.triggered).toBe(true);
    expect(result.message).toContain('PII detected');
  });

  it('should pass safe text in PII gate', () => {
    const result = PIIGate.evaluator({}, 'Hello world');
    expect(result.triggered).toBe(false);
  });
});
