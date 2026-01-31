import { describe, it, expect } from 'vitest';
import { store } from './store';

describe('Redux Store', () => {
  it('should have the correct initial state', () => {
    const state = store.getState();

    expect(state).toHaveProperty('mission');
    expect(state).toHaveProperty('governance');
    expect(state).toHaveProperty('context');
    expect(state).toHaveProperty('ui');

    // Check mission state
    expect(state.mission).toEqual({
      status: 'idle',
      trustScore: 100,
      logs: []
    });

    // Check governance state
    expect(state.governance).toEqual({
      activeGates: []
    });

    // Check context state
    expect(state.context).toEqual({
      missionId: null,
      vendor: 'opencode',
      metrics: {
        latency: 0,
        cost: 0
      }
    });

    // Check ui state
    expect(state.ui).toEqual({
      currentView: 'mission',
      isLoadingData: false,
      activeTabs: {},
      modals: {
        settingsOpen: false,
        artifactDetailsOpen: false,
        confirmationOpen: false,
      },
      confirmation: {
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null,
      },
      selectedArtifactId: null,
    });
  });

  it('should handle dispatched actions', () => {
    // Dispatch an action to update mission status
    store.dispatch({
      type: 'mission/setStatus',
      payload: 'executing'
    });

    // Check that the state was updated
    expect(store.getState().mission.status).toEqual('executing');

    // Dispatch an action to add a log
    store.dispatch({
      type: 'mission/addLog',
      payload: {
        id: 'test-id',
        timestamp: 123456789,
        text: 'Test log',
        type: 'info'
      }
    });

    // Check that the log was added
    const logs = store.getState().mission.logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].text).toEqual('Test log');
  });
});