import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { setStatus, addLog, adjustTrustScore } from './mission.slice';

// Re-export the type from the existing store for consistency
export interface GovernanceGate {
  id: string;
  type: 'pii' | 'security' | 'budget' | 'human_approval';
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Define the governance slice state
interface GovernanceState {
  activeGates: GovernanceGate[];
}

// Define the initial state
const initialState: GovernanceState = {
  activeGates: [],
};

// Create the governance slice
export const governanceSlice = createSlice({
  name: 'governance',
  initialState,
  reducers: {
    // Add a new gate
    addGate: (state, action: PayloadAction<Omit<GovernanceGate, 'status'>>) => {
      state.activeGates.push({
        ...action.payload,
        status: 'pending',
      });
    },

    // Update gate status
    updateGateStatus: (state, action: PayloadAction<{ id: string; status: GovernanceGate['status'] }>) => {
      const { id, status } = action.payload;
      const gate = state.activeGates.find((gate) => gate.id === id);
      if (gate) {
        gate.status = status;
      }
    },

    // Clear all gates
    clearGates: (state) => {
      state.activeGates = [];
    },
  },
});

// Export actions
export const { addGate, updateGateStatus, clearGates } = governanceSlice.actions;

// Thunk action to trigger a gate (combined with mission state updates)
export const triggerGate =
  (gate: Omit<GovernanceGate, 'status'>) =>
  (dispatch: any) => {
    // 1. Add the gate
    dispatch(addGate(gate));
    // 2. Update mission status to 'gated'
    dispatch(setStatus('gated'));
    // 3. Apply trust score penalty
    dispatch(adjustTrustScore(-5));
    // 4. Log the gate trigger
    dispatch(addLog(
      `Governance Gate Triggered: ${gate.message}`,
      'warning'
    ));
  };

// Thunk action to resolve a gate
export const resolveGate =
  (gateId: string, approved: boolean) =>
  (dispatch: any) => {
    // 1. Update gate status
    dispatch(updateGateStatus({
      id: gateId,
      status: approved ? 'approved' : 'rejected'
    }));

    // 2. Update mission status based on approval
    if (approved) {
      // Resume mission
      dispatch(setStatus('executing'));
      // Regain some trust
      dispatch(adjustTrustScore(2));
      // Log approval
      dispatch(addLog('Gate Approved: Resuming mission.', 'success'));
    } else {
      // Fail mission
      dispatch(setStatus('failed'));
      // Log rejection
      dispatch(addLog('Gate Rejected: Mission aborted.', 'error'));
    }
  };

// Export selectors
export const selectActiveGates = (state: RootState) => state.governance?.activeGates;
export const selectPendingGates = (state: RootState) =>
  state.governance?.activeGates.filter(gate => gate.status === 'pending');

// Export the reducer
export default governanceSlice.reducer;