import { describe, it, expect } from 'vitest';
import {
  contextSlice,
  setMissionId,
  setVendor,
  updateMetrics,
  setMetrics,
  resetContext
} from './context.slice';

describe('Context Slice', () => {
  const initialState = {
    missionId: null,
    vendor: 'opencode',
    metrics: {
      latency: 0,
      cost: 0
    }
  };

  it('should handle initial state', () => {
    expect(contextSlice.reducer(undefined, { type: 'unknown' })).toEqual({
      missionId: null,
      vendor: 'opencode',
      metrics: {
        latency: 0,
        cost: 0
      }
    });
  });

  it('should handle setMissionId', () => {
    const actual = contextSlice.reducer(initialState, setMissionId('mission-123'));
    expect(actual.missionId).toEqual('mission-123');
  });

  it('should handle setVendor', () => {
    const actual = contextSlice.reducer(initialState, setVendor('newProvider'));
    expect(actual.vendor).toEqual('newProvider');
  });

  it('should handle updateMetrics with partial data', () => {
    // Update just latency
    let state = contextSlice.reducer(initialState, updateMetrics({ latency: 100 }));
    expect(state.metrics).toEqual({
      latency: 100,
      cost: 0
    });

    // Update just cost
    state = contextSlice.reducer(initialState, updateMetrics({ cost: 1.23 }));
    expect(state.metrics).toEqual({
      latency: 0,
      cost: 1.23
    });

    // Update both
    state = contextSlice.reducer(initialState, updateMetrics({ latency: 50, cost: 0.75 }));
    expect(state.metrics).toEqual({
      latency: 50,
      cost: 0.75
    });
  });

  it('should handle setMetrics', () => {
    const actual = contextSlice.reducer(
      initialState,
      setMetrics({ latency: 200, cost: 2.5 })
    );
    expect(actual.metrics).toEqual({
      latency: 200,
      cost: 2.5
    });
  });

  it('should handle resetContext', () => {
    // Setup a state with missionId and metrics
    const state = {
      missionId: 'old-mission',
      vendor: 'customVendor',
      metrics: {
        latency: 150,
        cost: 3.25
      }
    };

    const actual = contextSlice.reducer(state, resetContext());

    // Should generate new missionId, reset metrics, but keep vendor
    expect(actual.missionId).not.toBeNull();
    expect(actual.missionId).not.toEqual('old-mission');
    expect(actual.vendor).toEqual('customVendor'); // Vendor should remain the same
    expect(actual.metrics).toEqual({
      latency: 0,
      cost: 0
    });
  });
});