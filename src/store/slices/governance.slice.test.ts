import { describe, it, expect, vi } from 'vitest';
import {
  governanceSlice,
  addGate,
  updateGateStatus,
  clearGates,
  triggerGate,
  resolveGate,
  GovernanceGate
} from './governance.slice';
import { setStatus, addLog, adjustTrustScore } from './mission.slice';

describe('Governance Slice', () => {
  const initialState = {
    activeGates: []
  };

  it('should handle initial state', () => {
    expect(governanceSlice.reducer(undefined, { type: 'unknown' })).toEqual({
      activeGates: []
    });
  });

  it('should handle addGate', () => {
    const gateData = {
      id: 'gate-123',
      type: 'pii' as const,
      message: 'Test gate',
      severity: 'medium' as const
    };

    const actual = governanceSlice.reducer(initialState, addGate(gateData));

    expect(actual.activeGates).toHaveLength(1);
    expect(actual.activeGates[0]).toEqual({
      ...gateData,
      status: 'pending'
    });
  });

  it('should handle updateGateStatus', () => {
    // Setup state with a pending gate
    const state = {
      activeGates: [
        {
          id: 'gate-123',
          type: 'pii' as const,
          message: 'Test gate',
          severity: 'medium' as const,
          status: 'pending' as const
        }
      ]
    };

    // Update the gate to approved
    const actual = governanceSlice.reducer(
      state,
      updateGateStatus({ id: 'gate-123', status: 'approved' })
    );

    expect(actual.activeGates[0].status).toEqual('approved');

    // Update the gate to rejected
    const actual2 = governanceSlice.reducer(
      state,
      updateGateStatus({ id: 'gate-123', status: 'rejected' })
    );

    expect(actual2.activeGates[0].status).toEqual('rejected');
  });

  it('should handle clearGates', () => {
    // Setup state with gates
    const state = {
      activeGates: [
        {
          id: 'gate-123',
          type: 'pii' as const,
          message: 'Test gate 1',
          severity: 'medium' as const,
          status: 'pending' as const
        },
        {
          id: 'gate-456',
          type: 'security' as const,
          message: 'Test gate 2',
          severity: 'high' as const,
          status: 'approved' as const
        }
      ]
    };

    const actual = governanceSlice.reducer(state, clearGates());

    expect(actual.activeGates).toHaveLength(0);
  });

  // Test thunk actions
  describe('Thunk Actions', () => {
    it('should handle triggerGate thunk', () => {
      const dispatch = vi.fn();
      const gateData = {
        id: 'gate-123',
        type: 'pii' as const,
        message: 'PII detected',
        severity: 'high' as const
      };

      // Call the thunk
      triggerGate(gateData)(dispatch);

      // Check that the right actions were dispatched in any order
      expect(dispatch).toHaveBeenCalledWith(addGate(gateData));
      expect(dispatch).toHaveBeenCalledWith(setStatus('gated'));
      expect(dispatch).toHaveBeenCalledWith(adjustTrustScore(-5));
      // Check for addLog action by type
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'mission/addLog'
      }));
    });

    it('should handle resolveGate thunk with approval', () => {
      const dispatch = vi.fn();

      // Call the thunk with approval
      resolveGate('gate-123', true)(dispatch);

      // Check that the right actions were dispatched
      expect(dispatch).toHaveBeenCalledWith(updateGateStatus({
        id: 'gate-123',
        status: 'approved'
      }));
      expect(dispatch).toHaveBeenCalledWith(setStatus('executing'));
      expect(dispatch).toHaveBeenCalledWith(adjustTrustScore(2));
      // Check for addLog action by type
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'mission/addLog'
      }));
    });

    it('should handle resolveGate thunk with rejection', () => {
      const dispatch = vi.fn();

      // Call the thunk with rejection
      resolveGate('gate-123', false)(dispatch);

      // Check that the right actions were dispatched
      expect(dispatch).toHaveBeenCalledWith(updateGateStatus({
        id: 'gate-123',
        status: 'rejected'
      }));
      expect(dispatch).toHaveBeenCalledWith(setStatus('failed'));
      // Check for addLog action by type
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'mission/addLog'
      }));
    });
  });
});