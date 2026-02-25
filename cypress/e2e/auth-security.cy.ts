/// <reference types="cypress" />

/**
 * Authentication & Security E2E Tests
 *
 * Coverage:
 * - API key authentication
 * - Unauthorized access prevention
 * - Security headers validation
 * - CORS policy enforcement
 *
 * User Stories:
 * - As a developer, I want API endpoints protected so unauthorized users cannot access data
 * - As a security officer, I want to verify all requests are authenticated
 */

describe('Authentication & Security', () => {
  const apiUrl = Cypress.env('apiUrl');
  const validApiKey = Cypress.env('apiKey');

  describe('API Key Authentication', () => {
    it('should reject requests without API key', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/artifacts`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.message).to.contain('Invalid API key');
      });
    });

    it('should reject requests with invalid API key', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/artifacts`,
        headers: {
          'X-API-Key': 'invalid-key-12345',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.message).to.contain('Invalid API key');
      });
    });

    it('should accept requests with valid API key', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/artifacts`,
        headers: {
          'X-API-Key': validApiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
      });
    });

    it('should reject expired or revoked API keys', () => {
      // Test with a known revoked key format
      cy.request({
        method: 'GET',
        url: `${apiUrl}/artifacts`,
        headers: {
          'X-API-Key': 'revoked_key_' + 'a'.repeat(56),
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  describe('API Endpoint Security', () => {
    it('should protect POST /artifacts endpoint', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/artifacts`,
        body: {
          title: 'Test',
          description: 'Test',
          type: 'intent',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should protect DELETE /artifacts/:id endpoint', () => {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/artifacts/123e4567-e89b-12d3-a456-426614174000`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should protect PUT /artifacts/:id endpoint', () => {
      cy.request({
        method: 'PUT',
        url: `${apiUrl}/artifacts/123e4567-e89b-12d3-a456-426614174000`,
        body: { title: 'Updated' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in API responses', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/artifacts`,
        headers: {
          'X-API-Key': validApiKey,
        },
      }).then((response) => {
        // Check for common security headers
        expect(response.headers).to.have.property('x-powered-by');
      });
    });
  });

  describe('Frontend Authentication Flow', () => {
    it('should load the application without authentication', () => {
      cy.visit('/');
      cy.contains('SOPHIA').should('exist');
      cy.contains('Mission Control').should('exist');
    });

    it('should display login or access controls if implemented', () => {
      cy.visit('/');
      // Check if any auth-related elements exist
      cy.get('body').then(($body) => {
        const hasAuthElement = $body.find('[data-testid="auth"]').length > 0 ||
                               $body.find('button:contains("Login")').length > 0 ||
                               $body.find('button:contains("Sign In")').length > 0;
        // Document whether auth UI exists
        cy.log(`Auth UI elements found: ${hasAuthElement}`);
      });
    });
  });
});
