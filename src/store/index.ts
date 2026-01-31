// Re-export everything from the store and hooks
export * from './store';
export * from './hooks';

// Re-export individual slices as they're available
export * from './slices/mission.slice';
export * from './slices/governance.slice';
export * from './slices/context.slice';
export * from './slices/ui.slice';

// Export the store as the default
import store from './store';
export default store;