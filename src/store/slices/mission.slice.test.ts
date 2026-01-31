import { describe, it, expect } from 'vitest';
import {
  missionSlice,
  setStatus,
  addLog,
  setTrustScore,
  adjustTrustScore,
  resetMission,
  MissionStatus,
  LogEntry
} from './mission.slice';

describe('Mission Slice', () => {
  const initialState = {
    status: 'idle' as MissionStatus,
    trustScore: 100,
    logs: []
  };

  it('should handle initial state', () => {
    expect(missionSlice.reducer(undefined, { type: 'unknown' })).toEqual({
      status: 'idle',
      trustScore: 100,
      logs: []
    });
  });

  it('should handle setStatus', () => {
    const actual = missionSlice.reducer(initialState, setStatus('executing'));
    expect(actual.status).toEqual('executing');
  });

  it('should handle addLog', () => {
    const actual = missionSlice.reducer(initialState, addLog('Test message', 'info'));

    expect(actual.logs).toHaveLength(1);
    expect(actual.logs[0].text).toEqual('Test message');
    expect(actual.logs[0].type).toEqual('info');
    expect(actual.logs[0].id).toBeDefined();
    expect(actual.logs[0].timestamp).toBeDefined();
  });

  it('should handle addLog with different types', () => {
    let state = initialState;

    state = missionSlice.reducer(state, addLog('Info message', 'info'));
    state = missionSlice.reducer(state, addLog('Success message', 'success'));
    state = missionSlice.reducer(state, addLog('Warning message', 'warning'));
    state = missionSlice.reducer(state, addLog('Error message', 'error'));

    expect(state.logs).toHaveLength(4);
    expect(state.logs[0].type).toEqual('info');
    expect(state.logs[1].type).toEqual('success');
    expect(state.logs[2].type).toEqual('warning');
    expect(state.logs[3].type).toEqual('error');
  });

  it('should handle setTrustScore', () => {
    const actual = missionSlice.reducer(initialState, setTrustScore(85));
    expect(actual.trustScore).toEqual(85);
  });

  it('should handle adjustTrustScore', () => {
    // Positive adjustment
    let state = missionSlice.reducer(initialState, adjustTrustScore(-10));
    expect(state.trustScore).toEqual(90);

    // Negative adjustment
    state = missionSlice.reducer(state, adjustTrustScore(-15));
    expect(state.trustScore).toEqual(75);

    // Increase
    state = missionSlice.reducer(state, adjustTrustScore(5));
    expect(state.trustScore).toEqual(80);

    // Don't go below 0
    state = missionSlice.reducer(state, adjustTrustScore(-100));
    expect(state.trustScore).toEqual(0);

    // Don't go above 100
    state = missionSlice.reducer(state, adjustTrustScore(200));
    expect(state.trustScore).toEqual(100);
  });

  it('should handle resetMission', () => {
    // Setup a state with logs, different status and trust score
    let state = {
      status: 'completed' as MissionStatus,
      trustScore: 75,
      logs: [
        { id: '1', timestamp: 123, text: 'Test', type: 'info' as const }
      ]
    };

    // Reset the mission
    state = missionSlice.reducer(state, resetMission());

    expect(state).toEqual({
      status: 'idle',
      trustScore: 100,
      logs: []
    });
  });
});