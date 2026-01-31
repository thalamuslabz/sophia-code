/// <reference types="cypress" />

describe('Artifact UI States', () => {
  beforeEach(() => {
    // Reset test data
    cy.resetTestData();
  });

  it('should show loading state while fetching artifacts', () => {
    // Intercept API calls to artifacts endpoint
    cy.intercept('GET', '**/artifacts', (req) => {
      // Delay the response to show loading state
      req.on('response', (res) => {
        res.setDelay(1000);
      });
    }).as('getArtifacts');

    // Visit the artifacts page
    cy.visit('/artifacts');

    // Check if loading state is shown
    cy.contains('Loading artifacts').should('exist');

    // Wait for the API call to complete
    cy.wait('@getArtifacts');

    // Loading should disappear
    cy.contains('Loading artifacts').should('not.exist');
  });

  it('should show empty state when no artifacts match filter', () => {
    // Create a single artifact of type intent
    cy.createArtifact({
      title: 'Only Intent',
      description: 'The only intent artifact',
      type: 'intent',
      trustScore: 85,
      author: { name: 'Test User', verified: true },
      tags: ['test'],
    });

    // Visit the page
    cy.visit('/artifacts');

    // Filter to gates (which should have none)
    cy.contains('button', 'Gates').click();

    // Check for empty state message
    cy.contains('No artifacts found matching your search criteria').should('exist');

    // Should have a button to show all
    cy.contains('button', 'Show all artifacts').should('exist');
    cy.contains('button', 'Show all artifacts').click();

    // Our artifact should be visible again
    cy.contains('Only Intent').should('exist');
  });

  it('should show error state when API fails', () => {
    // Intercept API calls to artifacts endpoint and force an error
    cy.intercept('GET', '**/artifacts', {
      statusCode: 500,
      body: {
        message: 'Internal Server Error',
      },
    }).as('getArtifactsError');

    // Visit the artifacts page
    cy.visit('/artifacts');

    // Check if error state is shown
    cy.contains('Error loading artifacts').should('exist');
    cy.contains('Internal Server Error').should('exist');

    // Should have retry button
    cy.contains('button', 'Retry').should('exist');
  });

  it('should show validation errors in the form', () => {
    // Visit the artifacts page
    cy.visit('/artifacts');

    // Open the form
    cy.get('button').contains('Plus').click();

    // Try to submit without filling required fields
    cy.contains('button', 'Create Artifact').click();

    // Should show validation errors
    cy.contains('Title is required').should('exist');
    cy.contains('Description is required').should('exist');
    cy.contains('Author name is required').should('exist');
    cy.contains('At least one tag is required').should('exist');

    // Fix one error by adding a title
    cy.get('input[name="title"]').type('Test Title');

    // That error should disappear
    cy.contains('Title is required').should('not.exist');

    // Other errors should remain
    cy.contains('Description is required').should('exist');
  });

  it('should show confirm dialog when deleting an artifact', () => {
    // Create a test artifact
    cy.createArtifact({
      title: 'Confirm Delete Test',
      description: 'Testing deletion confirmation',
      type: 'intent',
      trustScore: 85,
      author: { name: 'Test User', verified: true },
      tags: ['test', 'delete', 'confirm'],
    });

    // Visit the page
    cy.visit('/artifacts');

    // Click on the artifact to view details
    cy.contains('Confirm Delete Test').click();

    // Stub the window.confirm to verify it's called and return false
    const confirmStub = cy.stub().returns(false);
    cy.on('window:confirm', confirmStub);

    // Click delete button
    cy.contains('button', 'Delete').click();

    // Verify confirm was called with correct message
    cy.wrap(confirmStub).should('be.calledWith', 'Are you sure you want to delete this artifact?');

    // Artifact should still exist (since we cancelled)
    cy.contains('Confirm Delete Test').should('exist');
  });

  it('should copy artifact information', () => {
    // Create a test artifact
    cy.createArtifact({
      title: 'Copy Test Artifact',
      description: 'Testing copy functionality',
      type: 'intent',
      trustScore: 85,
      author: { name: 'Test User', verified: true },
      tags: ['test', 'copy'],
    });

    // Stub clipboard API
    cy.visit('/artifacts', {
      onBeforeLoad(win) {
        cy.stub(win, 'alert').as('alertStub');
      },
    });

    // Click on the artifact card copy button
    cy.contains('Copy Test Artifact')
      .parent()
      .within(() => {
        cy.contains('button', 'Copy Code').click();
      });

    // Alert should be shown (our mock implementation)
    cy.get('@alertStub').should('be.calledWith', 'Copied artifact: Copy Test Artifact');
  });
});