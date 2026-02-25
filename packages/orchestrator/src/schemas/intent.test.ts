import { describe, it, expect } from 'vitest';
import { intentSchema } from './intent';

describe('intentSchema', () => {
  it('should validate a complete intent', () => {
    const validIntent = {
      id: 'int-20240215-001',
      createdAt: '2026-02-15T10:30:00Z',
      project: 'ASO',
      author: 'developer',
      description: 'Add OAuth2 authentication',
      contractRef: 'ASO/auth-contract-v1.2.yaml',
      contractHash: 'sha256:a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4',
      acceptanceCriteria: ['User can login'],
      outOfScope: ['Other providers'],
      status: 'pending'
    };

    const result = intentSchema.safeParse(validIntent);
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const invalidIntent = {
      project: 'ASO',
      description: 'Add OAuth2'
    };

    const result = intentSchema.safeParse(invalidIntent);
    expect(result.success).toBe(false);
  });

  it('should reject invalid ID format', () => {
    const invalidIntent = {
      id: 'invalid-id-format',
      createdAt: '2026-02-15T10:30:00Z',
      project: 'ASO',
      author: 'developer',
      description: 'Add OAuth2 authentication',
      contractRef: 'ASO/auth-contract-v1.2.yaml',
      contractHash: 'sha256:a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4',
      acceptanceCriteria: ['User can login'],
      outOfScope: [],
      status: 'pending'
    };

    const result = intentSchema.safeParse(invalidIntent);
    expect(result.success).toBe(false);
  });

  it('should reject invalid contractHash format', () => {
    const invalidIntent = {
      id: 'int-20240215-001',
      createdAt: '2026-02-15T10:30:00Z',
      project: 'ASO',
      author: 'developer',
      description: 'Add OAuth2 authentication',
      contractRef: 'ASO/auth-contract-v1.2.yaml',
      contractHash: 'invalid-hash',
      acceptanceCriteria: ['User can login'],
      outOfScope: [],
      status: 'pending'
    };

    const result = intentSchema.safeParse(invalidIntent);
    expect(result.success).toBe(false);
  });

  it('should reject empty acceptanceCriteria array', () => {
    const invalidIntent = {
      id: 'int-20240215-001',
      createdAt: '2026-02-15T10:30:00Z',
      project: 'ASO',
      author: 'developer',
      description: 'Add OAuth2 authentication',
      contractRef: 'ASO/auth-contract-v1.2.yaml',
      contractHash: 'sha256:a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4',
      acceptanceCriteria: [],
      outOfScope: [],
      status: 'pending'
    };

    const result = intentSchema.safeParse(invalidIntent);
    expect(result.success).toBe(false);
  });

  it('should reject invalid status enum value', () => {
    const invalidIntent = {
      id: 'int-20240215-001',
      createdAt: '2026-02-15T10:30:00Z',
      project: 'ASO',
      author: 'developer',
      description: 'Add OAuth2 authentication',
      contractRef: 'ASO/auth-contract-v1.2.yaml',
      contractHash: 'sha256:a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4',
      acceptanceCriteria: ['User can login'],
      outOfScope: [],
      status: 'unknown_status'
    };

    const result = intentSchema.safeParse(invalidIntent);
    expect(result.success).toBe(false);
  });

  it('should reject description too short', () => {
    const invalidIntent = {
      id: 'int-20240215-001',
      createdAt: '2026-02-15T10:30:00Z',
      project: 'ASO',
      author: 'developer',
      description: 'Short',
      contractRef: 'ASO/auth-contract-v1.2.yaml',
      contractHash: 'sha256:a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4',
      acceptanceCriteria: ['User can login'],
      outOfScope: [],
      status: 'pending'
    };

    const result = intentSchema.safeParse(invalidIntent);
    expect(result.success).toBe(false);
  });
});
