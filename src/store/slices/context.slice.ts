import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Define the context slice state based on existing Zustand store
interface ContextState {
  missionId: string | null;
  vendor: string;
  metrics: {
    latency: number;
    cost: number;
  };
}

// Define the initial state
const initialState: ContextState = {
  missionId: null,
  vendor: 'opencode',
  metrics: {
    latency: 0,
    cost: 0
  }
};

// Create the context slice
export const contextSlice = createSlice({
  name: 'context',
  initialState,
  reducers: {
    // Set mission ID
    setMissionId: (state, action: PayloadAction<string>) => {
      state.missionId = action.payload;
    },

    // Set vendor
    setVendor: (state, action: PayloadAction<string>) => {
      state.vendor = action.payload;
    },

    // Update metrics
    updateMetrics: (state, action: PayloadAction<{ latency?: number; cost?: number }>) => {
      const { latency, cost } = action.payload;
      if (latency !== undefined) {
        state.metrics.latency = latency;
      }
      if (cost !== undefined) {
        state.metrics.cost = cost;
      }
    },

    // Set both metrics at once
    setMetrics: (state, action: PayloadAction<{ latency: number; cost: number }>) => {
      state.metrics = action.payload;
    },

    // Reset context
    resetContext: (state) => {
      state.missionId = Math.random().toString(36).substring(7);
      state.metrics = { latency: 0, cost: 0 };
      // Keep vendor intact for persistence
    }
  },
});

// Export actions
export const {
  setMissionId,
  setVendor,
  updateMetrics,
  setMetrics,
  resetContext
} = contextSlice.actions;

// Export selectors
export const selectMissionId = (state: RootState) => state.context?.missionId;
export const selectVendor = (state: RootState) => state.context?.vendor;
export const selectMetrics = (state: RootState) => state.context?.metrics;

// Export the reducer
export default contextSlice.reducer;