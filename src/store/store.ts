import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

// Import slices as they're implemented
import missionReducer from './slices/mission.slice';
import governanceReducer from './slices/governance.slice';
import contextReducer from './slices/context.slice';
import uiReducer from './slices/ui.slice';

export const store = configureStore({
  reducer: {
    // Add reducers as they're implemented
    mission: missionReducer,
    governance: governanceReducer,
    context: contextReducer,
    ui: uiReducer,
  },
  // Enable Redux DevTools
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export as the default
export default store;