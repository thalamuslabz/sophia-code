/// <reference types="cypress" />

/**
 * Artifact Lifecycle E2E Tests
 *
 * Coverage:
 * - Create artifacts of all types (Intent, Gate, Contract)
 * - Read/View artifact details
 * - Update artifact properties
 * - Delete artifacts
 * - Content hash generation
 * - Trust score validation
 *
 * User Stories:
 * - As a governance officer, I want to create intents that define what should be done
 * - As a reviewer, I want to create gates that control workflow progression
 * - As a project manager, I want to create contracts that define terms of work
 * - As an auditor, I want to verify artifact integrity via content hashes
 */

describe('Artifact Lifecycle', () => {
  const apiUrl = Cypress.env('apiUrl');
  const apiKey = Cypress.env('apiKey');

  // Test data cleanup tracking
  const createdArtifactIds: string[] = [];

  beforeEach(() => {
    // Visit artifacts page
    cy.visit('/artifacts');
    cy.contains('Artifacts').should('exist');
  });

  after(() => {
    // Cleanup: Delete all test artifacts
    createdArtifactIds.forEach((id) => {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/artifacts/${id}`,
        headers: { 'X-API-Key': apiKey },
        failOnStatusCode: false,
      });
    });
  });

  describe('Create Artifacts', () => {
    it('should create an Intent artifact via API', () => {
      const intent = {
        title: 'E2E Test Intent - ' + Date.now(),
        description: 'This intent defines a governance objective for E2E testing',
        type: 'intent',
        trustScore: 95,
        author: { name: 'E2E Test Suite', verified: true },
        tags: ['e2e', 'intent', 'governance'],
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: intent,
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body.title).to.eq(intent.title);
        expect(response.body.type).to.eq('intent');
        expect(response.body.contentHash).to.exist;
        createdArtifactIds.push(response.body.id);
      });
    });

    it('should create a Gate artifact via API', () => {
      const gate = {
        title: 'E2E Test Gate - ' + Date.now(),
        description: 'This gate controls progression for E2E testing',
        type: 'gate',
        trustScore: 88,
        author: { name: 'E2E Test Suite', verified: true },
        tags: ['e2e', 'gate', 'approval'],
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: gate,
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.type).to.eq('gate');
        createdArtifactIds.push(response.body.id);
      });
    });

    it('should create a Contract artifact via API', () => {
      const contract = {
        title: 'E2E Test Contract - ' + Date.now(),
        description: 'This contract defines terms for E2E testing',
        type: 'contract',
        trustScore: 92,
        author: { name: 'E2E Test Suite', verified: true },
        tags: ['e2e', 'contract', 'terms'],
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: contract,
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.type).to.eq('contract');
        createdArtifactIds.push(response.body.id);
      });
    });

    it('should create an artifact via UI', () => {
      const title = 'UI Created Artifact - ' + Date.now();

      // Open create form
      cy.get('button').contains('Plus').click();

      // Fill form
      cy.get('input[name="title"]').type(title);
      cy.get('textarea[name="description"]').type('Created through UI E2E test');
      cy.get('select[name="type"]').select('Intent');
      cy.get('input[type="range"]').invoke('val', 85).trigger('change');
      cy.get('input[name="author.name"]').type('UI Test User');
      cy.get('#authorVerified').check();
      cy.get('input[placeholder*="Add tags"]').type('ui-test{enter}');

      // Submit
      cy.contains('button', 'Create Artifact').click();

      // Verify
      cy.contains(title).should('exist');
    });

    it('should validate required fields when creating', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: '', // Empty title
          description: 'Test',
          type: 'intent',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
      });
    });
  });

  describe('Read Artifacts', () => {
    it('should retrieve all artifacts', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
      });
    });

    it('should retrieve a specific artifact by ID', () => {
      // First create an artifact
      const artifact = {
        title: 'Retrievable Artifact - ' + Date.now(),
        description: 'For testing retrieval',
        type: 'intent',
        trustScore: 90,
        author: { name: 'E2E', verified: true },
        tags: ['retrieval'],
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: artifact,
      }).then((postResponse) => {
        const id = postResponse.body.id;
        createdArtifactIds.push(id);

        // Now retrieve it
        cy.request({
          method: 'GET',
          url: `${apiUrl}/artifacts/${id}`,
          headers: { 'X-API-Key': apiKey },
        }).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body.id).to.eq(id);
          expect(getResponse.body.title).to.eq(artifact.title);
        });
      });
    });

    it('should return 404 for non-existent artifact', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/artifacts/00000000-0000-0000-0000-000000000000`,
        headers: { 'X-API-Key': apiKey },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });
  });

  describe('Update Artifacts', () => {
    it('should update an artifact via API', () => {
      // Create artifact
      const artifact = {
        title: 'Update Test - ' + Date.now(),
        description: 'Original description',
        type: 'intent',
        trustScore: 80,
        author: { name: 'E2E', verified: true },
        tags: ['update'],
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: artifact,
      }).then((postResponse) => {
        const id = postResponse.body.id;
        createdArtifactIds.push(id);

        // Update it
        const updatedTitle = 'Updated Title - ' + Date.now();
        cy.request({
          method: 'PUT',
          url: `${apiUrl}/artifacts/${id}`,
          headers: { 'X-API-Key': apiKey },
          body: {
            ...artifact,
            title: updatedTitle,
            description: 'Updated description',
          },
        }).then((putResponse) => {
          expect(putResponse.status).to.eq(200);
          expect(putResponse.body.title).to.eq(updatedTitle);
          expect(putResponse.body.description).to.eq('Updated description');
          // Content hash should change on update
          expect(putResponse.body.contentHash).to.not.eq(postResponse.body.contentHash);
        });
      });
    });
  });

  describe('Delete Artifacts', () => {
    it('should delete an artifact via API', () => {
      // Create artifact
      const artifact = {
        title: 'Delete Test - ' + Date.now(),
        description: 'To be deleted',
        type: 'intent',
        trustScore: 75,
        author: { name: 'E2E', verified: true },
        tags: ['delete'],
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: artifact,
      }).then((postResponse) => {
        const id = postResponse.body.id;

        // Delete it
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/artifacts/${id}`,
          headers: { 'X-API-Key': apiKey },
        }).then((deleteResponse) => {
          expect(deleteResponse.status).to.eq(200);

          // Verify it's gone
          cy.request({
            method: 'GET',
            url: `${apiUrl}/artifacts/${id}`,
            headers: { 'X-API-Key': apiKey },
            failOnStatusCode: false,
          }).then((getResponse) => {
            expect(getResponse.status).to.eq(404);
          });
        });
      });
    });
  });

  describe('Content Hash Integrity', () => {
    it('should generate unique content hashes for different artifacts', () => {
      const baseArtifact = {
        title: 'Hash Test',
        description: 'Testing hash uniqueness',
        type: 'intent',
        trustScore: 90,
        author: { name: 'E2E', verified: true },
        tags: ['hash'],
      };

      // Create two similar artifacts
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: { ...baseArtifact, title: 'Hash Test 1 - ' + Date.now() },
      }).then((res1) => {
        createdArtifactIds.push(res1.body.id);

        cy.request({
          method: 'POST',
          url: `${apiUrl}/artifacts`,
          headers: { 'X-API-Key': apiKey },
          body: { ...baseArtifact, title: 'Hash Test 2 - ' + Date.now() },
        }).then((res2) => {
          createdArtifactIds.push(res2.body.id);

          // Hashes should be different
          expect(res1.body.contentHash).to.not.eq(res2.body.contentHash);
        });
      });
    });
  });
});
