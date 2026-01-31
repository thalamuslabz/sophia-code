import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Artifact } from '../types';

// Create a wrapper for testing components that use the router
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
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