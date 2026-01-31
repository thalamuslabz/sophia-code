import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Re-export the types from the existing mission store for consistency
export type MissionStatus = 'idle' | 'planning' | 'executing' | 'gated' | 'completed' | 'failed';

export interface LogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  metadata?: any;
}

// Define the slice state
interface MissionState {
  status: MissionStatus;
  trustScore: number;
  logs: LogEntry[];
}

// Define the initial state
const initialState: MissionState = {
  status: 'idle',
  trustScore: 100,
  logs: [],
};

// Create the slice
export const missionSlice = createSlice({
  name: 'mission',
  initialState,
  reducers: {
    // Set mission status
    setStatus: (state, action: PayloadAction<MissionStatus>) => {
      state.status = action.payload;
    },

    // Add a log entry
    addLog: {
      reducer(state, action: PayloadAction<LogEntry>) {
        state.logs.push(action.payload);
      },
      prepare(text: string, type: LogEntry['type'] = 'info', metadata?: any) {
        return {
          payload: {
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
            text,
            type,
            metadata,
          },
        };
      },
    },

    // Update trust score
    setTrustScore: (state, action: PayloadAction<number>) => {
      state.trustScore = action.payload;
    },

    // Adjust trust score by a delta
    adjustTrustScore: (state, action: PayloadAction<number>) => {
      state.trustScore = Math.max(0, Math.min(100, state.trustScore + action.payload));
    },

    // Reset mission state
    resetMission: (state) => {
      state.status = 'idle';
      state.logs = [];
      state.trustScore = 100;
    },
  },
});

// Export actions
export const { setStatus, addLog, setTrustScore, adjustTrustScore, resetMission } = missionSlice.actions;

// Export selectors
export const selectMissionStatus = (state: RootState) => state.mission?.status;
export const selectLogs = (state: RootState) => state.mission?.logs;
export const selectTrustScore = (state: RootState) => state.mission?.trustScore;

// Export the reducer
export default missionSlice.reducer;