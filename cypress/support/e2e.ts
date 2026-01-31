// Import commands.ts
import './commands';

// Configure default behavior
beforeEach(() => {
  // Reset API data before each test
  cy.resetTestData();
});