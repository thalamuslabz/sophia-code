/// <reference types="cypress" />

describe('Artifact API Integration', () => {
  beforeEach(() => {
    // Clear any test artifacts before each test
    cy.resetTestData();
  });

  it('should create an artifact via API', () => {
    // Create a test artifact using our custom command
    const testArtifact = {
      title: 'API Test Artifact',
      description: 'Created via API in Cypress test',
      type: 'intent',
      trustScore: 85,
      author: { name: 'API Test', verified: true },
      tags: ['api', 'test', 'create'],
    };

    cy.createArtifact(testArtifact).then((response) => {
      // Verify the response
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body.name).to.equal(testArtifact.title);
      expect(response.body.description).to.equal(testArtifact.description);
      expect(response.body.type.toLowerCase()).to.equal(testArtifact.type);

      // Store artifact ID for later use
      const artifactId = response.body.id;

      // Visit the artifacts page and check if the new artifact appears
      cy.visit('/artifacts');
      cy.contains(testArtifact.title).should('exist');
    });
  });

  it('should fetch artifacts from API', () => {
    // Create multiple test artifacts
    const artifacts = [
      {
        title: 'API Fetch Test 1',
        description: 'First artifact for fetch test',
        type: 'gate',
        trustScore: 90,
        author: { name: 'Fetch Test', verified: true },
        tags: ['api', 'fetch', 'test'],
      },
      {
        title: 'API Fetch Test 2',
        description: 'Second artifact for fetch test',
        type: 'contract',
        trustScore: 75,
        author: { name: 'Fetch Test', verified: false },
        tags: ['api', 'fetch', 'test'],
      },
    ];

    // Create artifacts
    cy.createArtifact(artifacts[0]);
    cy.createArtifact(artifacts[1]);

    // Fetch artifacts directly from API
    cy.getArtifacts().then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');

      // Filter to find our test artifacts
      const testArtifacts = response.body.filter((a: any) =>
        a.name.includes('API Fetch Test')
      );

      expect(testArtifacts.length).to.be.at.least(2);

      // Verify the artifacts exist in the UI as well
      cy.visit('/artifacts');
      cy.contains('API Fetch Test 1').should('exist');
      cy.contains('API Fetch Test 2').should('exist');
    });
  });

  it('should update an artifact via API', () => {
    // Create an artifact to update
    cy.createArtifact({
      title: 'Update Me Artifact',
      description: 'This will be updated',
      type: 'intent',
      trustScore: 80,
      author: { name: 'Update Test', verified: false },
      tags: ['update', 'test'],
    }).then((response) => {
      const artifactId = response.body.id;

      // Update the artifact
      cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/artifacts/${artifactId}`,
        headers: {
          'X-API-Key': Cypress.env('apiKey'),
        },
        body: {
          name: 'Updated Artifact',
          description: 'This has been updated via API',
          status: 'APPROVED',
        },
      }).then((updateResponse) => {
        expect(updateResponse.status).to.equal(200);
        expect(updateResponse.body.name).to.equal('Updated Artifact');
        expect(updateResponse.body.description).to.equal('This has been updated via API');

        // Verify the update appears in the UI
        cy.visit('/artifacts');
        cy.contains('Updated Artifact').should('exist');
        cy.contains('This has been updated via API').should('exist');
      });
    });
  });

  it('should delete an artifact via API', () => {
    // Create an artifact to delete
    cy.createArtifact({
      title: 'Delete API Test',
      description: 'To be deleted via API',
      type: 'contract',
      trustScore: 70,
      author: { name: 'Delete Test', verified: true },
      tags: ['delete', 'api', 'test'],
    }).then((response) => {
      const artifactId = response.body.id;

      // First check the artifact exists in the UI
      cy.visit('/artifacts');
      cy.contains('Delete API Test').should('exist');

      // Delete the artifact
      cy.deleteArtifact(artifactId).then((deleteResponse) => {
        expect(deleteResponse.status).to.equal(204);

        // Reload page and check it's gone
        cy.reload();
        cy.contains('Delete API Test').should('not.exist');
      });
    });
  });

  it('should handle API errors gracefully', () => {
    // Try to get a non-existent artifact
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/artifacts/nonexistent-id`,
      headers: {
        'X-API-Key': Cypress.env('apiKey'),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(404);
    });

    // Try to access the API without an API key
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/artifacts`,
      failOnStatusCode: false,
      headers: {},
    }).then((response) => {
      expect(response.status).to.equal(401);
    });

    // Try to create an invalid artifact
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/artifacts`,
      headers: {
        'X-API-Key': Cypress.env('apiKey'),
      },
      body: {
        // Missing required fields
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(400);
    });
  });
});