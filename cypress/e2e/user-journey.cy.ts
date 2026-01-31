/// <reference types="cypress" />

describe('Complete User Journey', () => {
  beforeEach(() => {
    // Reset test data
    cy.resetTestData();

    // Create some initial artifacts
    cy.createArtifact({
      title: 'PII Detection Gate',
      description: 'Detects personally identifiable information in text',
      type: 'gate',
      trustScore: 95,
      author: { name: 'Security Team', verified: true },
      tags: ['security', 'pii', 'governance'],
    });

    cy.createArtifact({
      title: 'Code Generation Intent',
      description: 'Generates code based on natural language descriptions',
      type: 'intent',
      trustScore: 85,
      author: { name: 'Dev Tools', verified: true },
      tags: ['code', 'generation', 'productivity'],
    });

    // Visit the artifacts page
    cy.visit('/artifacts');
  });

  it('completes an entire workflow from browsing to creation to editing to deletion', () => {
    // Step 1: Browse and filter existing artifacts
    cy.log('**Step 1: Browse existing artifacts**');
    cy.contains('PII Detection Gate').should('exist');
    cy.contains('Code Generation Intent').should('exist');

    // Filter to only gates
    cy.contains('button', 'Gates').click();
    cy.contains('PII Detection Gate').should('exist');
    cy.contains('Code Generation Intent').should('not.exist');

    // Reset filter
    cy.contains('button', 'All').click();
    cy.contains('PII Detection Gate').should('exist');
    cy.contains('Code Generation Intent').should('exist');

    // Step 2: Search for artifacts
    cy.log('**Step 2: Search for artifacts**');
    cy.get('input[placeholder*="Search artifacts"]').type('code');
    cy.contains('Code Generation Intent').should('exist');
    cy.contains('PII Detection Gate').should('not.exist');

    // Clear search
    cy.get('input[placeholder*="Search artifacts"]').clear();

    // Step 3: View artifact details
    cy.log('**Step 3: View artifact details**');
    cy.contains('PII Detection Gate').click();
    cy.contains('Detects personally identifiable information in text').should('exist');
    cy.contains('#security').should('exist');
    cy.contains('#pii').should('exist');
    cy.contains('#governance').should('exist');
    cy.contains('Security Team').should('exist');
    cy.contains('95%').should('exist');

    // Close details
    cy.get('button').contains('X').click();

    // Step 4: Create a new artifact
    cy.log('**Step 4: Create a new artifact**');
    cy.get('button').contains('Plus').click();

    // Fill out the form
    cy.get('input[name="title"]').type('User Journey Test Artifact');
    cy.get('textarea[name="description"]').type('This artifact was created during a complete user journey test');
    cy.get('select[name="type"]').select('Contract');
    cy.get('input[type="range"]').invoke('val', 88).trigger('change');
    cy.get('input[name="author.name"]').type('E2E Test User');
    cy.get('#authorVerified').check();
    cy.get('input[placeholder*="Add tags"]').type('journey{enter}');
    cy.get('input[placeholder*="Add more tags"]').type('e2e{enter}');
    cy.get('input[placeholder*="Add more tags"]').type('workflow{enter}');

    // Submit the form
    cy.contains('button', 'Create Artifact').click();

    // Verify the artifact was created
    cy.contains('User Journey Test Artifact').should('exist');

    // Step 5: Edit the newly created artifact
    cy.log('**Step 5: Edit the artifact**');
    cy.contains('User Journey Test Artifact').click();
    cy.contains('This artifact was created during a complete user journey test').should('exist');

    // Copy the artifact
    cy.contains('button', 'Copy Artifact').click();

    // Click the delete button, but cancel
    const confirmStub = cy.stub().returns(false);
    cy.on('window:confirm', confirmStub);
    cy.contains('button', 'Delete').click();
    cy.wrap(confirmStub).should('be.calledWith', 'Are you sure you want to delete this artifact?');

    // Close the detail view
    cy.get('button').contains('X').click();

    // Step 6: Delete the artifact
    cy.log('**Step 6: Delete the artifact**');
    cy.contains('User Journey Test Artifact').click();

    // Now actually delete it
    cy.on('window:confirm', () => true);
    cy.contains('button', 'Delete').click();

    // Verify it's gone
    cy.contains('User Journey Test Artifact').should('not.exist');

    // Verify other artifacts still exist
    cy.contains('PII Detection Gate').should('exist');
    cy.contains('Code Generation Intent').should('exist');
  });
});