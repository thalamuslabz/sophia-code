# Unit Testing Guide for Sophia Code

This document explains the unit testing approach for the Sophia Code project.

## Overview

Unit testing focuses on testing individual components, functions, or modules in isolation. Our unit testing approach covers:

1. API client
2. Custom hooks
3. UI components
4. Business logic

## Testing Tools

The Sophia Code project uses the following testing tools:

- **Vitest**: Test runner compatible with Vite
- **Testing Library**: Utilities for testing React components
- **Jest DOM**: Additional DOM testing utilities
- **Mock Service Worker (MSW)**: API mocking (for future implementation)

## Test Structure

The unit tests follow a standard structure:

1. **API Client Tests**: Test the API client's methods and error handling
2. **Custom Hook Tests**: Test custom hooks like `useArtifacts`
3. **Component Tests**: Test React components in isolation
4. **Integration Tests**: Test combinations of components and hooks

## Running the Tests

To run the unit tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run a specific test file
npm test -- src/hooks/useArtifacts.test.ts
```

## Test Organization

Tests are organized to be co-located with the code they test:

- `src/lib/api/index.test.ts` - Tests for API client
- `src/hooks/useArtifacts.test.ts` - Tests for custom hooks
- `src/components/features/ArtifactCard.test.tsx` - Tests for components

## Mocking Strategy

The tests use different mocking strategies:

1. **API Calls**: Using `vi.mock()` to mock the fetch API
2. **Custom Hooks**: Using `vi.mock()` to mock hooks in component tests
3. **Component Dependencies**: Using `vi.mock()` to mock child components

### Mocking Example

```typescript
// Mock the useArtifacts hook
vi.mock('../hooks/useArtifacts', () => ({
  useArtifacts: vi.fn().mockReturnValue({
    artifacts: [],
    loading: false,
    error: null,
    // ... other hook properties and methods
  }),
}));
```

## Test Utilities

Custom test utilities help simplify testing:

1. **createMockArtifact**: Creates a mock artifact with default values
2. **createMockArtifacts**: Creates an array of mock artifacts
3. **render**: Custom render function that includes providers
4. **mockFetch**: Helper to mock fetch responses

## Testing Patterns

### Testing React Components

1. **Rendering**: Test that components render correctly
2. **User Interactions**: Test click, input, and other user interactions
3. **State Changes**: Test that component state changes correctly
4. **Conditional Rendering**: Test different states (loading, error, empty)
5. **Props**: Test that props affect rendering

### Testing Custom Hooks

1. **Initial State**: Test initial hook state
2. **Function Calls**: Test that hook functions call APIs correctly
3. **State Updates**: Test that hook state updates correctly
4. **Error Handling**: Test how hooks handle errors

### Testing API Client

1. **Request Formatting**: Test that requests are formatted correctly
2. **Response Handling**: Test that responses are processed correctly
3. **Error Handling**: Test how client handles different HTTP status codes

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component/hook does, not how it does it
2. **Keep Tests Isolated**: Each test should be independent of others
3. **Use Descriptive Test Names**: Test names should describe behavior
4. **Test Edge Cases**: Test loading, error, and empty states
5. **Avoid Implementation Details**: Don't test implementation details like state values
6. **Mock External Dependencies**: Mock APIs, hooks, and components that aren't under test

## Test Coverage

The project aims for high test coverage:

- **API Client**: 95%+
- **Custom Hooks**: 90%+
- **UI Components**: 85%+
- **Business Logic**: 90%+

## Troubleshooting

Common issues and solutions:

1. **Tests Can't Find Elements**: Use `screen.debug()` to see what's rendered
2. **Mocked Functions Not Called**: Check that mocking is set up correctly
3. **Tests Fail After Component Changes**: Update tests to match new component behavior
4. **Async Tests Time Out**: Use `await` and `waitFor` correctly

## Future Improvements

Planned improvements for the testing strategy:

1. **Mock Service Worker**: Replace direct fetch mocking with MSW
2. **Snapshot Testing**: Add snapshot testing for stable components
3. **Visual Regression Testing**: Add visual regression testing
4. **Performance Testing**: Add performance testing for critical components
5. **State Management Testing**: Add dedicated tests for state management