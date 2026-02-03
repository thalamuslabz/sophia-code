import { describe, it, expect, vi, beforeEach } from 'vitest';
import { artifactApi, ApiClient } from './index';
import { mockFetch } from '../../test/setup';
import { createMockArtifact } from '../../test/utils';

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use the correct base URL and API key', async () => {
    // Setup mock response
    mockFetch(200, []);

    // Create a new client with known values
    const customApiClient = new ApiClient('http://test-api-base.com', 'test-api-key-123');

    // Spy on the customApiClient's getHeaders method
    const getHeadersSpy = vi.spyOn(customApiClient as any, 'getHeaders');

    // Make a simple request
    await customApiClient.get('/test-endpoint');

    // Check the headers contain what we expect
    expect(getHeadersSpy).toHaveBeenCalled();
    expect(getHeadersSpy.mock.results[0].value).toEqual({
      'Content-Type': 'application/json',
      'X-API-Key': 'test-api-key-123'
    });

    // Also verify the URL was constructed correctly
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-api-base.com/test-endpoint',
      expect.anything()
    );
  });
  });

  describe('getAllArtifacts', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();
    });

    it('should fetch all artifacts and map them correctly', async () => {
      // Mock the backend response
      const backendArtifacts = [
        {
          id: 'test-id-1',
          name: 'Test Artifact 1',
          description: 'Description 1',
          type: 'INTENT',
          metadata: {
            trustScore: 90,
            tags: ['tag1', 'tag2'],
            authorName: 'Test Author',
            authorVerified: true,
          },
          hash: 'hash1',
        },
        {
          id: 'test-id-2',
          name: 'Test Artifact 2',
          description: 'Description 2',
          type: 'GATE',
          metadata: {
            trustScore: 80,
            tags: ['tag3', 'tag4'],
            authorName: 'Another Author',
            authorVerified: false,
          },
          hash: 'hash2',
        },
      ];

      // Reset and set up mock response
      vi.resetAllMocks();
      mockFetch(200, backendArtifacts);

      // Call the method
      const result = await artifactApi.getAllArtifacts();

      // Verify the mapping
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-id-1');
      expect(result[0].title).toBe('Test Artifact 1');
      expect(result[0].description).toBe('Description 1');
      expect(result[0].type).toBe('intent');
      expect(result[0].trustScore).toBe(90);
      expect(result[0].tags).toEqual(['tag1', 'tag2']);
      expect(result[0].author.name).toBe('Test Author');
      expect(result[0].author.verified).toBe(true);
      expect(result[0].contentHash).toBe('hash1');

      expect(result[1].id).toBe('test-id-2');
      expect(result[1].type).toBe('gate');
    });

    it('should handle API errors', async () => {
      // Reset and mock a failed response
      vi.resetAllMocks();
      mockFetch(500, { message: 'Internal server error' });

      // The API call should throw
      await expect(artifactApi.getAllArtifacts()).rejects.toThrow();
    });
  });

  describe('getArtifactById', () => {
    it('should fetch a single artifact by ID', async () => {
      const backendArtifact = {
        id: 'test-id-1',
        name: 'Test Artifact 1',
        description: 'Description 1',
        type: 'INTENT',
        metadata: {
          trustScore: 90,
          tags: ['tag1', 'tag2'],
          authorName: 'Test Author',
          authorVerified: true,
        },
        hash: 'hash1',
      };

      mockFetch(200, backendArtifact);

      // Call the method
      const result = await artifactApi.getArtifactById('test-id-1');

      // Verify the result
      expect(result.id).toBe('test-id-1');
      expect(result.title).toBe('Test Artifact 1');
      expect(result.type).toBe('intent');
    });

    it('should handle not found errors', async () => {
      // Mock a 404 response
      mockFetch(404, { message: 'Artifact not found' });

      // The API call should throw
      await expect(artifactApi.getArtifactById('non-existent')).rejects.toThrow();
    });
  });

  describe('createArtifact', () => {
    it('should create an artifact and return the mapped result', async () => {
      // Prepare the test artifact
      const frontendArtifact = createMockArtifact({
        title: 'New Artifact',
        description: 'New description',
        type: 'contract',
      });

      // Mock the response
      const backendResponse = {
        id: 'new-id-123',
        name: 'New Artifact',
        description: 'New description',
        type: 'CONTRACT',
        status: 'DRAFT',
        metadata: {
          trustScore: 85,
          tags: ['test', 'mock'],
          authorName: 'Test Author',
          authorVerified: true,
        },
        hash: 'new-hash',
      };

      mockFetch(201, backendResponse);

      // Call the method
      const result = await artifactApi.createArtifact(frontendArtifact);

      // Verify the result
      expect(result.id).toBe('new-id-123');
      expect(result.title).toBe('New Artifact');
      expect(result.type).toBe('contract');
      expect(result.contentHash).toBe('new-hash');

      // Verify the fetch call (mapping from frontend to backend)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/artifacts',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('CONTRACT'), // The type should be uppercase in the request
        })
      );
    });
  });

  describe('updateArtifact', () => {
    it('should update an existing artifact', async () => {
      // Prepare the update data
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      // Mock the response
      const backendResponse = {
        id: 'test-id-1',
        name: 'Updated Title',
        description: 'Updated description',
        type: 'INTENT',
        status: 'APPROVED',
        metadata: {
          trustScore: 90,
          tags: ['tag1', 'tag2'],
          authorName: 'Test Author',
          authorVerified: true,
        },
        hash: 'hash1',
      };

      mockFetch(200, backendResponse);

      // Call the method
      const result = await artifactApi.updateArtifact('test-id-1', updateData);

      // Verify the result
      expect(result.id).toBe('test-id-1');
      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated description');

      // Verify the fetch call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/artifacts/test-id-1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('Updated Title'),
        })
      );
    });
  });

  describe('deleteArtifact', () => {
    it('should delete an artifact', async () => {
      // Mock the response
      mockFetch(204, null);

      // Call the method
      await artifactApi.deleteArtifact('test-id-1');

      // Verify the fetch call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/artifacts/test-id-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle errors when deleting', async () => {
      // Mock a 404 response
      mockFetch(404, { message: 'Artifact not found' });

      // The API call should throw
      await expect(artifactApi.deleteArtifact('non-existent')).rejects.toThrow();
    });
  });