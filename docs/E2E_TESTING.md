# End-to-End Testing Guide for Sophia Code

This guide explains how to run and develop end-to-end tests for the Sophia Code project using Cypress.

## Overview

End-to-end (E2E) tests validate that the application works correctly from a user's perspective by simulating user interactions with the application. Our E2E tests cover:

1. Artifact management (browsing, filtering, searching)
2. Creating, editing, and deleting artifacts
3. API integration
4. UI states (loading, errors, empty states)
5. Complete user journeys

## Prerequisites

Before running E2E tests, ensure you have:

1. Docker and Docker Compose installed
2. Node.js v18+ installed
3. The project dependencies installed (`npm install`)

## Running the Tests

### Option 1: Using Docker Compose

The simplest way to run the tests is using Docker Compose:

```bash
# Start all services including frontend, backend, and database
docker-compose up -d

# Run the tests in headless mode
npm run test:e2e:headless
```

### Option 2: Manual Setup

If you prefer to run each component separately:

1. Start the database:
   ```bash
   docker-compose up database
   ```

2. Start the backend:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

3. Start the frontend:
   ```bash
   npm install
   npm run dev
   ```

4. Open Cypress:
   ```bash
   npm run test:e2e
   ```

## Test Structure

The E2E tests are organized into several files:

- `artifacts.cy.ts` - Tests for the artifacts UI
- `artifact-api.cy.ts` - Tests for the API integration
- `artifact-ui-states.cy.ts` - Tests for loading, error, and empty states
- `user-journey.cy.ts` - Complete user flow tests

## Custom Commands

We've created several custom Cypress commands to make testing easier:

- `cy.createArtifact(artifactData)` - Creates an artifact via the API
- `cy.deleteArtifact(artifactId)` - Deletes an artifact via the API
- `cy.getArtifacts()` - Fetches all artifacts via the API
- `cy.resetTestData()` - Cleans up test data before each test

## Best Practices

When writing E2E tests:

1. **Test from a user's perspective** - Focus on what users can see and do
2. **Keep tests independent** - Each test should clean up after itself
3. **Use custom commands for repeated operations** - Helps keep tests DRY
4. **Target stable selectors** - Use data attributes rather than relying on text or CSS
5. **Test both happy and error paths** - Ensure the application handles errors gracefully

## Common Issues and Troubleshooting

### Connection Issues

If tests fail with connection errors:

```
Error: Failed to fetch artifacts
Error: connect ECONNREFUSED 127.0.0.1:3000
```

Make sure:
- The backend service is running on port 3000
- The API key is correctly set in both the backend `.env` and Cypress configuration

### Test Data Issues

If tests fail because they can't find expected artifacts:

```
Timed out retrying after 4000ms: Expected to find content: 'Test Artifact' but never did.
```

Try:
- Running `cy.resetTestData()` manually in the Cypress console
- Checking the database connection
- Verifying that the API endpoints are working correctly

## Extending the Tests

To add new tests:

1. Create a new file in `cypress/e2e/`
2. Import custom commands from `cypress/support/commands.ts`
3. Use the existing tests as templates
4. Run the new tests to verify they work correctly

## CI Integration

These tests are automatically run in CI on pull requests and pushes to the main branch. The CI workflow:

1. Starts the services using Docker Compose
2. Runs the tests in headless mode
3. Captures screenshots and videos on failures
4. Reports results in the GitHub workflow summary