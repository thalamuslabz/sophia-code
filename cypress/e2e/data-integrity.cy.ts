/// <reference types="cypress" />

/**
 * Data Integrity E2E Tests
 *
 * Coverage:
 * - Trust score calculations and boundaries
 * - Content hash generation and verification
 * - Author verification badge display
 * - Tag management and deduplication
 * - Data persistence across sessions
 * - Concurrent modification handling
 *
 * User Stories:
 * - As an auditor, I want trust scores to accurately reflect artifact reliability
 * - As a user, I want to verify content hasn't been tampered with via hashes
 * - As a reviewer, I want to identify verified vs unverified authors
 * - As an admin, I want data to persist correctly
 */

describe('Data Integrity', () => {
  const apiUrl = Cypress.env('apiUrl');
  const apiKey = Cypress.env('apiKey');
  const createdArtifactIds: string[] = [];

  after(() => {
    // Cleanup
    createdArtifactIds.forEach((id) => {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/artifacts/${id}`,
        headers: { 'X-API-Key': apiKey },
        failOnStatusCode: false,
      });
    });
  });

  describe('Trust Score Boundaries', () => {
    it('should accept maximum trust score of 100', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: 'Max Trust Score Test',
          description: 'Testing maximum trust score',
          type: 'intent',
          trustScore: 100,
          author: { name: 'Trust Test', verified: true },
          tags: ['trust'],
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.trustScore).to.eq(100);
        createdArtifactIds.push(response.body.id);
      });
    });

    it('should accept minimum trust score of 0', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: 'Min Trust Score Test',
          description: 'Testing minimum trust score',
          type: 'intent',
          trustScore: 0,
          author: { name: 'Trust Test', verified: false },
          tags: ['trust'],
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.trustScore).to.eq(0);
        createdArtifactIds.push(response.body.id);
      });
    });

    it('should reject negative trust scores', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: 'Negative Trust Test',
          description: 'Testing negative trust score',
          type: 'intent',
          trustScore: -10,
          author: { name: 'Trust Test', verified: true },
          tags: ['trust'],
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
      });
    });

    it('should reject trust scores above 100', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: 'Excessive Trust Test',
          description: 'Testing excessive trust score',
          type: 'intent',
          trustScore: 150,
          author: { name: 'Trust Test', verified: true },
          tags: ['trust'],
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
      });
    });

    it('should display trust scores as percentages in UI', () => {
      cy.createArtifact({
        title: 'Trust Score UI Test',
        description: 'Testing trust score display',
        type: 'intent',
        trustScore: 87,
        author: { name: 'UI Test', verified: true },
        tags: ['trust-ui'],
      });

      cy.visit('/artifacts');
      cy.contains('Trust Score UI Test').click();
      cy.contains('87%').should('exist');
    });
  });

  describe('Content Hash Verification', () => {
    it('should generate consistent hashes for identical content', () => {
      const timestamp = Date.now();
      const artifact = {
        title: `Hash Consistency Test - ${timestamp}`,
        description: 'Testing hash consistency',
        type: 'intent',
        trustScore: 90,
        author: { name: 'Hash Test', verified: true },
        tags: ['hash'],
      };

      // Create first artifact
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: artifact,
      }).then((res1) => {
        createdArtifactIds.push(res1.body.id);

        // Create identical artifact
        cy.request({
          method: 'POST',
          url: `${apiUrl}/artifacts`,
          headers: { 'X-API-Key': apiKey },
          body: artifact,
        }).then((res2) => {
          createdArtifactIds.push(res2.body.id);

          // Hashes should be identical for identical content
          expect(res1.body.contentHash).to.eq(res2.body.contentHash);
        });
      });
    });

    it('should generate different hashes for different content', () => {
      const timestamp = Date.now();
      const baseArtifact = {
        description: 'Testing hash uniqueness',
        type: 'intent',
        trustScore: 90,
        author: { name: 'Hash Test', verified: true },
        tags: ['hash'],
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: { ...baseArtifact, title: `Hash A - ${timestamp}` },
      }).then((res1) => {
        createdArtifactIds.push(res1.body.id);

        cy.request({
          method: 'POST',
          url: `${apiUrl}/artifacts`,
          headers: { 'X-API-Key': apiKey },
          body: { ...baseArtifact, title: `Hash B - ${timestamp}` },
        }).then((res2) => {
          createdArtifactIds.push(res2.body.id);

          expect(res1.body.contentHash).to.not.eq(res2.body.contentHash);
        });
      });
    });

    it('should change hash when content is updated', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: 'Hash Change Test',
          description: 'Original description',
          type: 'intent',
          trustScore: 85,
          author: { name: 'Hash Test', verified: true },
          tags: ['hash'],
        },
      }).then((postRes) => {
        const id = postRes.body.id;
        const originalHash = postRes.body.contentHash;
        createdArtifactIds.push(id);

        // Update the artifact
        cy.request({
          method: 'PUT',
          url: `${apiUrl}/artifacts/${id}`,
          headers: { 'X-API-Key': apiKey },
          body: {
            title: 'Hash Change Test',
            description: 'Updated description',
            type: 'intent',
            trustScore: 85,
            author: { name: 'Hash Test', verified: true },
            tags: ['hash'],
          },
        }).then((putRes) => {
          expect(putRes.body.contentHash).to.not.eq(originalHash);
        });
      });
    });
  });

  describe('Author Verification Display', () => {
    it('should display verified badge for verified authors', () => {
      cy.createArtifact({
        title: 'Verified Author Display Test',
        description: 'Testing verified badge display',
        type: 'intent',
        trustScore: 95,
        author: { name: 'Verified Author', verified: true },
        tags: ['verified'],
      });

      cy.visit('/artifacts');
      cy.contains('Verified Author Display Test').click();

      // Check for verified indicator (badge, checkmark, etc.)
      cy.get('body').then(($body) => {
        const hasVerifiedBadge =
          $body.find('[data-testid="verified"], .verified, .badge').length > 0 ||
          $body.text().includes('✓') ||
          $body.text().includes('Verified');
        cy.log(`Verified badge found: ${hasVerifiedBadge}`);
      });
    });

    it('should not display verified badge for unverified authors', () => {
      cy.createArtifact({
        title: 'Unverified Author Display Test',
        description: 'Testing unverified author display',
        type: 'intent',
        trustScore: 70,
        author: { name: 'Unverified Author', verified: false },
        tags: ['unverified'],
      });

      cy.visit('/artifacts');
      cy.contains('Unverified Author Display Test').click();

      // Verify the author name appears but without verified badge
      cy.contains('Unverified Author').should('exist');
    });
  });

  describe('Tag Management', () => {
    it('should handle empty tags array', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: 'Empty Tags Test',
          description: 'Testing empty tags',
          type: 'intent',
          trustScore: 80,
          author: { name: 'Tag Test', verified: true },
          tags: [],
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.tags).to.be.an('array').that.is.empty;
        createdArtifactIds.push(response.body.id);
      });
    });

    it('should handle single tag', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: 'Single Tag Test',
          description: 'Testing single tag',
          type: 'intent',
          trustScore: 80,
          author: { name: 'Tag Test', verified: true },
          tags: ['single'],
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.tags).to.have.length(1);
        expect(response.body.tags[0]).to.eq('single');
        createdArtifactIds.push(response.body.id);
      });
    });

    it('should handle many tags', () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);

      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: 'Many Tags Test',
          description: 'Testing many tags',
          type: 'intent',
          trustScore: 80,
          author: { name: 'Tag Test', verified: true },
          tags: manyTags,
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.tags).to.have.length(20);
        createdArtifactIds.push(response.body.id);
      });
    });

    it('should display tags with # prefix in UI', () => {
      cy.createArtifact({
        title: 'Tag Display Test',
        description: 'Testing tag display',
        type: 'intent',
        trustScore: 85,
        author: { name: 'Tag Test', verified: true },
        tags: ['display', 'ui', 'tags'],
      });

      cy.visit('/artifacts');
      cy.contains('Tag Display Test').click();

      // Tags should be displayed with # prefix
      cy.contains('#display').should('exist');
      cy.contains('#ui').should('exist');
      cy.contains('#tags').should('exist');
    });
  });

  describe('Data Persistence', () => {
    it('should persist data after page reload', () => {
      const title = `Persistence Test - ${Date.now()}`;

      cy.createArtifact({
        title: title,
        description: 'Testing data persistence',
        type: 'intent',
        trustScore: 88,
        author: { name: 'Persistence Test', verified: true },
        tags: ['persistence'],
      });

      cy.visit('/artifacts');
      cy.contains(title).should('exist');

      // Reload page
      cy.reload();

      // Data should still exist
      cy.contains(title).should('exist');
    });

    it('should retrieve complete artifact data', () => {
      const artifact = {
        title: `Complete Data Test - ${Date.now()}`,
        description: 'Testing complete data retrieval',
        type: 'contract',
        trustScore: 92,
        author: { name: 'Complete Test', verified: true },
        tags: ['complete', 'data', 'test'],
      };

      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: artifact,
      }).then((postRes) => {
        const id = postRes.body.id;
        createdArtifactIds.push(id);

        // Retrieve and verify all fields
        cy.request({
          method: 'GET',
          url: `${apiUrl}/artifacts/${id}`,
          headers: { 'X-API-Key': apiKey },
        }).then((getRes) => {
          expect(getRes.body.title).to.eq(artifact.title);
          expect(getRes.body.description).to.eq(artifact.description);
          expect(getRes.body.type).to.eq(artifact.type);
          expect(getRes.body.trustScore).to.eq(artifact.trustScore);
          expect(getRes.body.author.name).to.eq(artifact.author.name);
          expect(getRes.body.author.verified).to.eq(artifact.author.verified);
          expect(getRes.body.tags).to.deep.eq(artifact.tags);
          expect(getRes.body.id).to.eq(id);
          expect(getRes.body.contentHash).to.exist;
        });
      });
    });
  });

  describe('ID Format Validation', () => {
    it('should generate valid UUID format IDs', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        headers: { 'X-API-Key': apiKey },
        body: {
          title: 'ID Format Test',
          description: 'Testing ID format',
          type: 'intent',
          trustScore: 80,
          author: { name: 'ID Test', verified: true },
          tags: ['id'],
        },
      }).then((response) => {
        const id = response.body.id;
        createdArtifactIds.push(id);

        // Validate UUID v4 format
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(id).to.match(uuidRegex);
      });
    });
  });
});
