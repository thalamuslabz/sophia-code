import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import missionReducer from './slices/mission.slice';
import governanceReducer, { triggerGate, resolveGate } from './slices/governance.slice';
import { GovernanceEngine } from '../lib/governance/engine';

// Create a test store for these tests
const createTestStore = () => configureStore({
  reducer: {
    mission: missionReducer,
    governance: governanceReducer
  }
});

describe('Cortex & Governance System', () => {
  let store: any;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Mission Store', () => {
    it('should initialize with idle status', () => {
      const state = store.getState();
      expect(state.mission.status).toBe('idle');
      expect(state.mission.trustScore).toBe(100);
    });

    it('should transition to gated when triggerGate is called', () => {
      store.dispatch(triggerGate({
        id: 'test-gate',
        type: 'security',
        message: 'Security Alert',
        severity: 'high'
      }));

      const state = store.getState();
      expect(state.mission.status).toBe('gated');
      expect(state.governance.activeGates).toHaveLength(1);
    });

    it('should resume execution when gate is approved', () => {
      // First trigger
      store.dispatch(triggerGate({
        id: 'test-gate',
        type: 'security',
        message: 'Security Alert',
        severity: 'high'
      }));

      // Then resolve
      store.dispatch(resolveGate('test-gate', true));

      const state = store.getState();
      expect(state.mission.status).toBe('executing');
      expect(state.governance.activeGates[0].status).toBe('approved');
    });
  });

  describe('Governance Engine', () => {
    it('should detect PII in stream', () => {
      GovernanceEngine.analyzeStream('Contact user at test@example.com immediately.', store.dispatch);

      const state = store.getState();
      expect(state.governance.activeGates).toHaveLength(1);
      expect(state.governance.activeGates[0].type).toBe('pii');
    });

    it('should detect destructive commands', () => {
      // Reset the store first
      store = createTestStore();

      GovernanceEngine.analyzeStream('Executing: rm -rf / root directory', store.dispatch);

      const state = store.getState();
      expect(state.governance.activeGates).toHaveLength(1);
      expect(state.governance.activeGates[0].message).toContain('Destructive');
    });

    it('should ignore safe text', () => {
      // Reset the store first
      store = createTestStore();

      GovernanceEngine.analyzeStream('Hello world, this is a safe string.', store.dispatch);

      const state = store.getState();
      expect(state.governance.activeGates).toHaveLength(0);
    });
  });
});
