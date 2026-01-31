/// <reference types="cypress" />

// Custom commands for Cypress tests
Cypress.Commands.add('login', () => {
  // For future authentication implementation
  cy.log('Logged in with test user');
});

// Command to create an artifact via the API
Cypress.Commands.add('createArtifact', (artifactData) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/artifacts`,
    headers: {
      'X-API-Key': Cypress.env('apiKey'),
    },
    body: {
      name: artifactData.title,
      description: artifactData.description,
      type: artifactData.type.toUpperCase(),
      metadata: {
        trustScore: artifactData.trustScore,
        tags: artifactData.tags,
        authorName: artifactData.author?.name || 'Test User',
        authorAvatar: artifactData.author?.avatar || '',
        authorVerified: artifactData.author?.verified || false,
      },
    },
  });
});

// Command to delete an artifact via the API
Cypress.Commands.add('deleteArtifact', (artifactId) => {
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/artifacts/${artifactId}`,
    headers: {
      'X-API-Key': Cypress.env('apiKey'),
    },
    failOnStatusCode: false,
  });
});

// Command to get artifacts via the API
Cypress.Commands.add('getArtifacts', () => {
  return cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/artifacts`,
    headers: {
      'X-API-Key': Cypress.env('apiKey'),
    },
  });
});

// Command to reset test data
Cypress.Commands.add('resetTestData', () => {
  // Get all artifacts
  cy.getArtifacts().then((response) => {
    // Delete any test artifacts
    response.body.forEach((artifact: any) => {
      if (artifact.name.includes('Test Artifact') ||
          artifact.description.includes('Created by Cypress')) {
        cy.deleteArtifact(artifact.id);
      }
    });
  });
});

// Declare global Cypress namespace to add custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      createArtifact(artifactData: any): Chainable<any>
      deleteArtifact(artifactId: string): Chainable<any>
      getArtifacts(): Chainable<any>
      resetTestData(): Chainable<void>
    }
  }
}