import { describe, it, expect, beforeEach } from 'vitest';
import { useMissionStore } from './mission';
import { GovernanceEngine } from '../lib/governance/engine';

describe('Cortex & Governance System', () => {
  beforeEach(() => {
    useMissionStore.getState().resetMission();
  });

  describe('Mission Store', () => {
    it('should initialize with idle status', () => {
      const state = useMissionStore.getState();
      expect(state.status).toBe('idle');
      expect(state.trustScore).toBe(100);
    });

    it('should transition to gated when triggerGate is called', () => {
      useMissionStore.getState().triggerGate({
        id: 'test-gate',
        type: 'security',
        message: 'Security Alert',
        severity: 'high'
      });
      
      const state = useMissionStore.getState();
      expect(state.status).toBe('gated');
      expect(state.activeGates).toHaveLength(1);
    });

    it('should resume execution when gate is approved', () => {
      // First trigger
      useMissionStore.getState().triggerGate({
        id: 'test-gate',
        type: 'security',
        message: 'Security Alert',
        severity: 'high'
      });
      
      // Then resolve
      useMissionStore.getState().resolveGate('test-gate', true);
      
      const state = useMissionStore.getState();
      expect(state.status).toBe('executing');
      expect(state.activeGates[0].status).toBe('approved');
    });
  });

  describe('Governance Engine', () => {
    it('should detect PII in stream', () => {
      GovernanceEngine.analyzeStream('Contact user at test@example.com immediately.');
      
      const state = useMissionStore.getState();
      expect(state.activeGates).toHaveLength(1);
      expect(state.activeGates[0].type).toBe('pii');
    });

    it('should detect destructive commands', () => {
      GovernanceEngine.analyzeStream('Executing: rm -rf / root directory');
      
      const state = useMissionStore.getState();
      expect(state.activeGates).toHaveLength(1);
      expect(state.activeGates[0].message).toContain('Destructive');
    });

    it('should ignore safe text', () => {
      GovernanceEngine.analyzeStream('Hello world, this is a safe string.');
      
      const state = useMissionStore.getState();
      expect(state.activeGates).toHaveLength(0);
    });
  });
});
