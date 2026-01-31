/// <reference types="cypress" />

describe('Artifacts Management', () => {
  beforeEach(() => {
    // Visit the artifacts page
    cy.visit('/artifacts');

    // Wait for the page to load
    cy.contains('Artifacts').should('exist');
  });

  it('should display the artifact explorer', () => {
    // Check if the search input exists
    cy.get('input[placeholder*="Search artifacts"]').should('exist');

    // Check if the filter buttons exist
    cy.contains('button', 'All').should('exist');
    cy.contains('button', 'Intents').should('exist');
    cy.contains('button', 'Gates').should('exist');
    cy.contains('button', 'Contracts').should('exist');
  });

  it('should create a new artifact', () => {
    // Open the create artifact form
    cy.get('button').contains('Plus').click();

    // Fill out the form
    cy.get('input[name="title"]').type('Cypress Test Artifact');
    cy.get('textarea[name="description"]').type('This is an artifact created by Cypress E2E test');
    cy.get('select[name="type"]').select('Gate');

    // Set trust score (using range input)
    cy.get('input[type="range"]').invoke('val', 90).trigger('change');

    // Add author name
    cy.get('input[name="author.name"]').type('Cypress Test User');

    // Check the verified author checkbox
    cy.get('#authorVerified').check();

    // Add tags
    cy.get('input[placeholder*="Add tags"]').type('cypress{enter}');
    cy.get('input[placeholder*="Add more tags"]').type('e2e{enter}');
    cy.get('input[placeholder*="Add more tags"]').type('test{enter}');

    // Submit the form
    cy.contains('button', 'Create Artifact').click();

    // Verify the artifact was created
    cy.contains('Cypress Test Artifact').should('exist');
    cy.contains('This is an artifact created by Cypress E2E test').should('exist');
  });

  it('should filter artifacts by type', () => {
    // Create test artifacts of different types via API
    const baseArtifact = {
      title: 'Test Artifact',
      description: 'Created by Cypress for filtering test',
      trustScore: 85,
      author: { name: 'Cypress', verified: true },
      tags: ['cypress', 'test'],
    };

    cy.createArtifact({ ...baseArtifact, title: 'Test Intent', type: 'intent' });
    cy.createArtifact({ ...baseArtifact, title: 'Test Gate', type: 'gate' });
    cy.createArtifact({ ...baseArtifact, title: 'Test Contract', type: 'contract' });

    // Reload the page to see new artifacts
    cy.reload();

    // All artifacts should be visible
    cy.contains('Test Intent').should('exist');
    cy.contains('Test Gate').should('exist');
    cy.contains('Test Contract').should('exist');

    // Filter by Intent
    cy.contains('button', 'Intents').click();
    cy.contains('Test Intent').should('exist');
    cy.contains('Test Gate').should('not.exist');
    cy.contains('Test Contract').should('not.exist');

    // Filter by Gate
    cy.contains('button', 'Gates').click();
    cy.contains('Test Intent').should('not.exist');
    cy.contains('Test Gate').should('exist');
    cy.contains('Test Contract').should('not.exist');

    // Filter by Contract
    cy.contains('button', 'Contracts').click();
    cy.contains('Test Intent').should('not.exist');
    cy.contains('Test Gate').should('not.exist');
    cy.contains('Test Contract').should('exist');

    // Show all again
    cy.contains('button', 'All').click();
    cy.contains('Test Intent').should('exist');
    cy.contains('Test Gate').should('exist');
    cy.contains('Test Contract').should('exist');
  });

  it('should search for artifacts by title', () => {
    // Create test artifacts with different titles via API
    cy.createArtifact({
      title: 'Alpha Artifact',
      description: 'Created by Cypress for search test',
      type: 'intent',
      trustScore: 85,
      author: { name: 'Cypress', verified: true },
      tags: ['cypress', 'test'],
    });

    cy.createArtifact({
      title: 'Beta Artifact',
      description: 'Created by Cypress for search test',
      type: 'intent',
      trustScore: 85,
      author: { name: 'Cypress', verified: true },
      tags: ['cypress', 'test'],
    });

    // Reload the page to see new artifacts
    cy.reload();

    // Search for Alpha
    cy.get('input[placeholder*="Search artifacts"]').type('Alpha');

    // Alpha should be visible, Beta should not
    cy.contains('Alpha Artifact').should('exist');
    cy.contains('Beta Artifact').should('not.exist');

    // Clear search and try another term
    cy.get('input[placeholder*="Search artifacts"]').clear().type('Beta');

    // Beta should be visible, Alpha should not
    cy.contains('Alpha Artifact').should('not.exist');
    cy.contains('Beta Artifact').should('exist');
  });

  it('should view artifact details', () => {
    // Create a test artifact via API
    const testArtifact = {
      title: 'Detailed Artifact',
      description: 'This artifact has many details to view',
      type: 'contract',
      trustScore: 95,
      author: { name: 'Cypress Detail', verified: true },
      tags: ['detail', 'view', 'test'],
    };

    cy.createArtifact(testArtifact);
    cy.reload();

    // Click on the artifact to view details
    cy.contains('Detailed Artifact').click();

    // Check if detail sidebar appears
    cy.contains('This artifact has many details to view').should('exist');
    cy.contains('#detail').should('exist');
    cy.contains('#view').should('exist');
    cy.contains('#test').should('exist');
    cy.contains('Cypress Detail').should('exist');
    cy.contains('95%').should('exist');

    // Close the detail view
    cy.get('button').contains('X').click();

    // Sidebar should disappear
    cy.contains('This artifact has many details to view').should('not.be.visible');
  });

  it('should delete an artifact', () => {
    // Create a test artifact via API
    cy.createArtifact({
      title: 'Delete Me Artifact',
      description: 'This artifact will be deleted',
      type: 'intent',
      trustScore: 85,
      author: { name: 'Cypress', verified: true },
      tags: ['delete', 'test'],
    });
    cy.reload();

    // Click on the artifact to view details
    cy.contains('Delete Me Artifact').click();

    // Click the delete button
    cy.contains('button', 'Delete').click();

    // Confirm delete in the dialog (using window.confirm stub)
    cy.on('window:confirm', () => true);

    // Verify the artifact was deleted
    cy.contains('Delete Me Artifact').should('not.exist');
  });
});