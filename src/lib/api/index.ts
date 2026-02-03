import type { Artifact } from '../../types';
import { ApiClient } from './client';
import { ApiError } from './errors';
import { apiLogger as logger } from '../utils/logger';

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// API key from environment (for development/testing)
const API_KEY = import.meta.env.VITE_API_KEY || '';

/**
 * API service for artifacts
 */
export class ArtifactApi {
  private client: ApiClient;

  constructor(baseUrl = API_BASE_URL, apiKey = API_KEY) {
    this.client = new ApiClient(baseUrl, apiKey);
  }

  /**
   * Get all artifacts
   */
  async getAllArtifacts(): Promise<Artifact[]> {
    try {
      logger.info('Fetching all artifacts');

      const backendArtifacts = await this.client.get<any[]>('/artifacts', {
        retry: true, // Enable retry with default settings
      });

      logger.debug('Fetched artifacts', { count: backendArtifacts.length });

      // Transform the backend model to the frontend model
      return backendArtifacts.map(this.mapToFrontendModel);
    } catch (error) {
      this.logError('Error fetching artifacts', error);
      throw this.enhanceError(error, 'Failed to fetch artifacts');
    }
  }

  /**
   * Get artifact by ID
   */
  async getArtifactById(id: string): Promise<Artifact> {
    try {
      logger.info(`Fetching artifact by ID: ${id}`);

      const artifact = await this.client.get<any>(`/artifacts/${id}`, {
        retry: true, // Enable retry with default settings
      });

      logger.debug('Fetched artifact', { id, name: artifact.name });

      return this.mapToFrontendModel(artifact);
    } catch (error) {
      this.logError(`Error fetching artifact ${id}`, error);
      throw this.enhanceError(error, `Failed to fetch artifact ${id}`);
    }
  }

  /**
   * Create a new artifact
   */
  async createArtifact(artifactData: Omit<Artifact, 'id'>): Promise<Artifact> {
    try {
      logger.info('Creating artifact', { title: artifactData.title });

      const backendData = this.mapToBackendModel(artifactData);
      const response = await this.client.post<any>('/artifacts', backendData, {
        // Less aggressive retry for mutations
        retry: {
          maxRetries: 2,
          retryableStatusCodes: [408, 500, 502, 503, 504],
        },
      });

      logger.debug('Created artifact', { id: response.id, name: response.name });

      return this.mapToFrontendModel(response);
    } catch (error) {
      this.logError('Error creating artifact', error);
      throw this.enhanceError(error, 'Failed to create artifact');
    }
  }

  /**
   * Update an existing artifact
   */
  async updateArtifact(id: string, artifactData: Partial<Artifact>): Promise<Artifact> {
    try {
      logger.info(`Updating artifact: ${id}`, { title: artifactData.title });

      const backendData = this.mapToBackendModel(artifactData);
      const response = await this.client.put<any>(`/artifacts/${id}`, backendData, {
        // Less aggressive retry for mutations
        retry: {
          maxRetries: 2,
          retryableStatusCodes: [408, 500, 502, 503, 504],
        },
      });

      logger.debug('Updated artifact', { id, name: response.name });

      return this.mapToFrontendModel(response);
    } catch (error) {
      this.logError(`Error updating artifact ${id}`, error);
      throw this.enhanceError(error, `Failed to update artifact ${id}`);
    }
  }

  /**
   * Delete an artifact
   */
  async deleteArtifact(id: string): Promise<void> {
    try {
      logger.info(`Deleting artifact: ${id}`);

      await this.client.delete(`/artifacts/${id}`, {
        // Less aggressive retry for mutations
        retry: {
          maxRetries: 1,
          retryableStatusCodes: [408, 500, 502, 503, 504],
        },
      });

      logger.debug('Deleted artifact', { id });
    } catch (error) {
      this.logError(`Error deleting artifact ${id}`, error);
      throw this.enhanceError(error, `Failed to delete artifact ${id}`);
    }
  }

  /**
   * Map backend artifact model to frontend model
   */
  private mapToFrontendModel(backendArtifact: any): Artifact {
    const { id, name, description, type, metadata, hash, createdBy } = backendArtifact;

    // Extract trustScore from metadata or set a default
    const trustScore = metadata?.trustScore || 85;

    // Extract tags from metadata or set defaults
    const tags = metadata?.tags || [];

    // Extract author info
    const authorName = metadata?.authorName || createdBy || 'Unknown';

    return {
      id,
      type: type.toLowerCase(),
      title: name,
      description,
      trustScore,
      author: {
        name: authorName,
        avatar: metadata?.authorAvatar || '',
        verified: metadata?.authorVerified || false
      },
      tags,
      contentHash: hash || ''
    };
  }

  /**
   * Map frontend artifact model to backend model
   */
  private mapToBackendModel(frontendArtifact: Partial<Artifact>): any {
    const { title, description, type, trustScore, author, tags } = frontendArtifact;

    return {
      name: title,
      description,
      type: type?.toUpperCase(),
      metadata: {
        trustScore,
        tags,
        authorName: author?.name,
        authorAvatar: author?.avatar,
        authorVerified: author?.verified
      }
    };
  }

  /**
   * Log an error with context
   */
  private logError(message: string, error: any): void {
    if (error instanceof ApiError) {
      logger.error(message, {
        status: error.status,
        message: error.message,
        data: error.data,
      });
    } else {
      logger.error(message, error);
    }
  }

  /**
   * Enhance an error with a user-friendly message
   */
  private enhanceError(error: any, fallbackMessage: string): Error {
    if (error instanceof ApiError) {
      // The error is already an ApiError, so we can just return it
      return error;
    }

    // For other errors, create a new Error with the fallback message
    const enhancedError = new Error(fallbackMessage);
    enhancedError.cause = error;
    return enhancedError;
  }
}

// Export singleton instance
export const artifactApi = new ArtifactApi();

// Export types and classes for testing and extensions
export { ApiClient } from './client';
export { ApiError } from './errors';