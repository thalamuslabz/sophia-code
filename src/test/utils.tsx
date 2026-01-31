import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import missionReducer from '../store/slices/mission.slice';
import governanceReducer from '../store/slices/governance.slice';
import contextReducer from '../store/slices/context.slice';
import uiReducer from '../store/slices/ui.slice';
import { Artifact } from '../types';

// Create a test store
const createTestStore = () => configureStore({
  reducer: {
    mission: missionReducer,
    governance: governanceReducer,
    context: contextReducer,
    ui: uiReducer,
  },
  // Customize initial state if needed
  preloadedState: {
    // Example: preloaded state
    context: {
      missionId: 'test-mission',
      vendor: 'opencode',
      metrics: { latency: 0, cost: 0 }
    }
  }
});

// Create a wrapper for testing components that use the router and Redux
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // Create a fresh store for each test to avoid state leakage
  const store = createTestStore();

  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock data helpers
export const createMockArtifact = (overrides = {}): Artifact => ({
  id: 'test-id-123',
  type: 'intent',
  title: 'Test Artifact',
  description: 'This is a test artifact',
  trustScore: 85,
  author: {
    name: 'Test Author',
    avatar: '',
    verified: true,
  },
  tags: ['test', 'mock'],
  contentHash: 'abcd1234',
  ...overrides,
});

export const createMockArtifacts = (count = 3): Artifact[] => {
  return Array.from({ length: count }).map((_, index) =>
    createMockArtifact({
      id: `test-id-${index}`,
      title: `Test Artifact ${index + 1}`,
      type: index % 3 === 0 ? 'intent' : index % 3 === 1 ? 'gate' : 'contract',
    })
  );
};