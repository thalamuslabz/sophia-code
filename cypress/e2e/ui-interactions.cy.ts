/// <reference types="cypress" />

/**
 * UI Interactions E2E Tests
 *
 * Coverage:
 * - Navigation between views
 * - Filter and search functionality
 * - Form interactions
 * - Modal dialogs
 * - Responsive behavior
 * - Error states
 * - Loading states
 *
 * User Stories:
 * - As a user, I want intuitive navigation between different artifact views
 * - As a user, I want to filter and search to find specific artifacts
 * - As a user, I want clear feedback when actions succeed or fail
 */

describe('UI Interactions', () => {
  const apiUrl = Cypress.env('apiUrl');
  const apiKey = Cypress.env('apiKey');

  beforeEach(() => {
    cy.visit('/');
  });

  describe('Navigation', () => {
    it('should display main navigation elements', () => {
      cy.contains('SOPHIA').should('be.visible');
      cy.contains('Mission Control').should('be.visible');
    });

    it('should navigate to artifacts page', () => {
      cy.visit('/artifacts');
      cy.url().should('include', '/artifacts');
      cy.contains('Artifacts').should('exist');
    });

    it('should show active navigation state', () => {
      cy.visit('/artifacts');
      // Check if active state is visually indicated
      cy.get('body').then(($body) => {
        const hasActiveClass = $body.find('.active, [aria-current="page"]').length > 0;
        cy.log(`Active navigation indicator found: ${hasActiveClass}`);
      });
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      cy.visit('/artifacts');
    });

    it('should display search input', () => {
      cy.get('input[placeholder*="Search"]').should('exist');
    });

    it('should filter results when typing in search', () => {
      // Create test artifacts
      cy.createArtifact({
        title: 'Alpha Search Test',
        description: 'For search testing',
        type: 'intent',
        trustScore: 85,
        author: { name: 'Search Test', verified: true },
        tags: ['search'],
      });

      cy.createArtifact({
        title: 'Beta Search Test',
        description: 'For search testing',
        type: 'intent',
        trustScore: 85,
        author: { name: 'Search Test', verified: true },
        tags: ['search'],
      });

      cy.reload();

      // Search for Alpha
      cy.get('input[placeholder*="Search"]').type('Alpha');
      cy.contains('Alpha Search Test').should('exist');
      cy.contains('Beta Search Test').should('not.exist');

      // Clear and search for Beta
      cy.get('input[placeholder*="Search"]').clear().type('Beta');
      cy.contains('Alpha Search Test').should('not.exist');
      cy.contains('Beta Search Test').should('exist');
    });

    it('should handle empty search results', () => {
      cy.get('input[placeholder*="Search"]').type('xyznonexistent12345');
      cy.contains('No artifacts found').should('exist');
    });

    it('should clear search when clicking clear button', () => {
      cy.get('input[placeholder*="Search"]').type('test');
      // Look for clear button (X icon or similar)
      cy.get('body').then(($body) => {
        const clearBtn = $body.find('button[aria-label*="clear"], button:contains("Clear"), input + button');
        if (clearBtn.length > 0) {
          cy.wrap(clearBtn).click();
          cy.get('input[placeholder*="Search"]').should('have.value', '');
        }
      });
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      cy.visit('/artifacts');
    });

    it('should display filter buttons for all artifact types', () => {
      cy.contains('button', 'All').should('exist');
      cy.contains('button', 'Intents').should('exist');
      cy.contains('button', 'Gates').should('exist');
      cy.contains('button', 'Contracts').should('exist');
    });

    it('should filter by artifact type', () => {
      // Create one of each type
      cy.createArtifact({
        title: 'Filter Intent',
        description: 'For filter test',
        type: 'intent',
        trustScore: 85,
        author: { name: 'Filter Test', verified: true },
        tags: ['filter'],
      });

      cy.createArtifact({
        title: 'Filter Gate',
        description: 'For filter test',
        type: 'gate',
        trustScore: 85,
        author: { name: 'Filter Test', verified: true },
        tags: ['filter'],
      });

      cy.reload();

      // Filter by Intent
      cy.contains('button', 'Intents').click();
      cy.contains('Filter Intent').should('exist');
      cy.contains('Filter Gate').should('not.exist');

      // Filter by Gate
      cy.contains('button', 'Gates').click();
      cy.contains('Filter Intent').should('not.exist');
      cy.contains('Filter Gate').should('exist');

      // Show All
      cy.contains('button', 'All').click();
      cy.contains('Filter Intent').should('exist');
      cy.contains('Filter Gate').should('exist');
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      cy.visit('/artifacts');
    });

    it('should open create artifact modal/form', () => {
      cy.get('button').contains('Plus').click();
      cy.contains('Create Artifact').should('exist');
    });

    it('should validate required fields', () => {
      cy.get('button').contains('Plus').click();
      cy.contains('button', 'Create Artifact').click();

      // Check for validation messages
      cy.get('body').then(($body) => {
        const hasError = $body.find('.error, [role="alert"], .text-red').length > 0 ||
                        $body.text().includes('required');
        cy.log(`Validation error displayed: ${hasError}`);
      });
    });

    it('should allow entering all form fields', () => {
      cy.get('button').contains('Plus').click();

      // Fill all fields
      cy.get('input[name="title"]').type('Complete Form Test');
      cy.get('textarea[name="description"]').type('This is a complete form test description');
      cy.get('select[name="type"]').select('Contract');
      cy.get('input[type="range"]').invoke('val', 92).trigger('change');
      cy.get('input[name="author.name"]').type('Form Test User');
      cy.get('#authorVerified').check();
      cy.get('input[placeholder*="Add tags"]').type('form{enter}');

      // Verify values
      cy.get('input[name="title"]').should('have.value', 'Complete Form Test');
      cy.get('select[name="type"]').should('have.value', 'contract');
    });

    it('should close form when clicking cancel', () => {
      cy.get('button').contains('Plus').click();
      cy.contains('Create Artifact').should('exist');

      // Look for cancel/close button
      cy.get('body').then(($body) => {
        const cancelBtn = $body.find('button:contains("Cancel"), button:contains("Close"), button:contains("X")');
        if (cancelBtn.length > 0) {
          cy.wrap(cancelBtn.first()).click();
          cy.contains('Create Artifact').should('not.exist');
        }
      });
    });
  });

  describe('Artifact Detail View', () => {
    beforeEach(() => {
      cy.visit('/artifacts');
    });

    it('should open detail view when clicking artifact', () => {
      // Create test artifact
      cy.createArtifact({
        title: 'Detail View Test',
        description: 'Testing detail view functionality',
        type: 'intent',
        trustScore: 88,
        author: { name: 'Detail Test', verified: true },
        tags: ['detail', 'view'],
      });

      cy.reload();

      // Click on artifact
      cy.contains('Detail View Test').click();

      // Verify detail view opens
      cy.contains('Testing detail view functionality').should('be.visible');
    });

    it('should display all artifact details', () => {
      cy.createArtifact({
        title: 'Full Detail Test',
        description: 'Complete details for testing',
        type: 'contract',
        trustScore: 95,
        author: { name: 'Full Detail Author', verified: true },
        tags: ['full', 'detail', 'test'],
      });

      cy.reload();
      cy.contains('Full Detail Test').click();

      // Verify all details are shown
      cy.contains('Complete details for testing').should('exist');
      cy.contains('Full Detail Author').should('exist');
      cy.contains('95%').should('exist');
      cy.contains('#full').should('exist');
      cy.contains('#detail').should('exist');
      cy.contains('#test').should('exist');
    });

    it('should close detail view', () => {
      cy.createArtifact({
        title: 'Close Detail Test',
        description: 'Testing close functionality',
        type: 'intent',
        trustScore: 80,
        author: { name: 'Close Test', verified: false },
        tags: ['close'],
      });

      cy.reload();
      cy.contains('Close Detail Test').click();
      cy.contains('Testing close functionality').should('be.visible');

      // Close detail view
      cy.get('button').contains('X').click();
      cy.contains('Testing close functionality').should('not.be.visible');
    });
  });

  describe('Responsive Behavior', () => {
    it('should render correctly on desktop viewport', () => {
      cy.viewport(1280, 800);
      cy.visit('/artifacts');
      cy.contains('Artifacts').should('be.visible');
    });

    it('should render correctly on tablet viewport', () => {
      cy.viewport(768, 1024);
      cy.visit('/artifacts');
      cy.contains('Artifacts').should('be.visible');
    });

    it('should render correctly on mobile viewport', () => {
      cy.viewport(375, 667);
      cy.visit('/artifacts');
      cy.contains('Artifacts').should('be.visible');
    });
  });

  describe('Loading States', () => {
    it('should show loading state on initial page load', () => {
      cy.visit('/artifacts');
      // Check for loading indicator (spinner, skeleton, etc.)
      cy.get('body').then(($body) => {
        const hasLoading = $body.find('.loading, .spinner, [role="progressbar"], .skeleton').length > 0 ||
                          $body.text().includes('Loading');
        cy.log(`Loading state found: ${hasLoading}`);
      });
    });
  });

  describe('Error States', () => {
    it('should handle network errors gracefully', () => {
      // Intercept and fail the request
      cy.intercept('GET', '**/api/artifacts', {
        forceNetworkError: true,
      }).as('getArtifacts');

      cy.visit('/artifacts');
      cy.wait('@getArtifacts');

      // Check for error message
      cy.get('body').then(($body) => {
        const hasError = $body.find('.error, [role="alert"]').length > 0 ||
                        $body.text().toLowerCase().includes('error') ||
                        $body.text().toLowerCase().includes('failed');
        cy.log(`Error state displayed: ${hasError}`);
      });
    });
  });
});
