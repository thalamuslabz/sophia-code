import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useArtifacts } from './useArtifacts';
import { artifactApi } from '../lib/api';
import { createMockArtifacts, createMockArtifact } from '../test/utils';

// Mock the API
vi.mock('../lib/api', () => ({
  artifactApi: {
    getAllArtifacts: vi.fn(),
    getArtifactById: vi.fn(),
    createArtifact: vi.fn(),
    updateArtifact: vi.fn(),
    deleteArtifact: vi.fn(),
  }
}));

describe('useArtifacts hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty artifacts and loading state', () => {
    // Setup mock to return artifacts later
    const mockArtifacts = createMockArtifacts(3);
    vi.mocked(artifactApi.getAllArtifacts).mockResolvedValue(mockArtifacts);

    // Render the hook
    const { result } = renderHook(() => useArtifacts());

    // Initial state should be empty artifacts and loading true
    expect(result.current.artifacts).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should fetch artifacts on mount', async () => {
    // Setup mock
    const mockArtifacts = createMockArtifacts(3);
    vi.mocked(artifactApi.getAllArtifacts).mockResolvedValue(mockArtifacts);

    // Render the hook
    const { result } = renderHook(() => useArtifacts());

    // Wait for the data to load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check that data is loaded
    expect(result.current.artifacts).toEqual(mockArtifacts);
    expect(result.current.error).toBe(null);
    expect(artifactApi.getAllArtifacts).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch errors', async () => {
    // Setup mock to throw error
    const error = new Error('Failed to fetch');
    vi.mocked(artifactApi.getAllArtifacts).mockRejectedValue(error);

    // Render the hook
    const { result } = renderHook(() => useArtifacts());

    // Wait for the error to be set
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check error state
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Failed to fetch');
    expect(result.current.artifacts).toEqual([]);
  });

  it('should get artifact by ID', async () => {
    // Setup mocks
    const mockArtifacts = createMockArtifacts(3);
    const mockArtifact = mockArtifacts[0];
    vi.mocked(artifactApi.getAllArtifacts).mockResolvedValue(mockArtifacts);
    vi.mocked(artifactApi.getArtifactById).mockResolvedValue(mockArtifact);

    // Render the hook
    const { result } = renderHook(() => useArtifacts());

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Call getArtifactById
    let returnedArtifact;
    await act(async () => {
      returnedArtifact = await result.current.getArtifactById(mockArtifact.id);
    });

    // Check result
    expect(artifactApi.getArtifactById).toHaveBeenCalledWith(mockArtifact.id);
    expect(returnedArtifact).toEqual(mockArtifact);
    expect(result.current.selectedArtifact).toEqual(mockArtifact);
  });

  it('should create a new artifact', async () => {
    // Setup mocks
    const mockArtifacts = createMockArtifacts(3);
    const newArtifact = createMockArtifact({
      id: 'new-id',
      title: 'New Artifact',
    });
    vi.mocked(artifactApi.getAllArtifacts).mockResolvedValue(mockArtifacts);
    vi.mocked(artifactApi.createArtifact).mockResolvedValue(newArtifact);

    // Render the hook
    const { result } = renderHook(() => useArtifacts());

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Create a new artifact
    let returnedArtifact;
    await act(async () => {
      returnedArtifact = await result.current.createArtifact(newArtifact);
    });

    // Check that artifact was added to state
    expect(artifactApi.createArtifact).toHaveBeenCalledWith(newArtifact);
    expect(returnedArtifact).toEqual(newArtifact);
    expect(result.current.artifacts).toHaveLength(4);
    expect(result.current.artifacts[3]).toEqual(newArtifact);
  });

  it('should update an existing artifact', async () => {
    // Setup mocks
    const mockArtifacts = createMockArtifacts(3);
    const existingArtifact = mockArtifacts[0];
    const updatedArtifact = { ...existingArtifact, title: 'Updated Title' };

    vi.mocked(artifactApi.getAllArtifacts).mockResolvedValue(mockArtifacts);
    vi.mocked(artifactApi.updateArtifact).mockResolvedValue(updatedArtifact);

    // Render the hook
    const { result } = renderHook(() => useArtifacts());

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Set selected artifact
    act(() => {
      result.current.setSelectedArtifact(existingArtifact);
    });

    // Update the artifact
    let returnedArtifact;
    await act(async () => {
      returnedArtifact = await result.current.updateArtifact(existingArtifact.id, { title: 'Updated Title' });
    });

    // Check that artifact was updated in state
    expect(artifactApi.updateArtifact).toHaveBeenCalledWith(existingArtifact.id, { title: 'Updated Title' });
    expect(returnedArtifact).toEqual(updatedArtifact);

    // Find the updated artifact in the list
    const updatedArtifactInList = result.current.artifacts.find(a => a.id === existingArtifact.id);
    expect(updatedArtifactInList?.title).toBe('Updated Title');

    // Selected artifact should also be updated
    expect(result.current.selectedArtifact).toEqual(updatedArtifact);
  });

  it('should delete an artifact', async () => {
    // Setup mocks
    const mockArtifacts = createMockArtifacts(3);
    const artifactToDelete = mockArtifacts[0];

    vi.mocked(artifactApi.getAllArtifacts).mockResolvedValue(mockArtifacts);
    vi.mocked(artifactApi.deleteArtifact).mockResolvedValue(undefined);

    // Render the hook
    const { result } = renderHook(() => useArtifacts());

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Set selected artifact
    act(() => {
      result.current.setSelectedArtifact(artifactToDelete);
    });

    // Delete the artifact
    let success = false;
    await act(async () => {
      success = await result.current.deleteArtifact(artifactToDelete.id);
    });

    // Check that artifact was removed from state
    expect(artifactApi.deleteArtifact).toHaveBeenCalledWith(artifactToDelete.id);
    expect(success).toBe(true);
    expect(result.current.artifacts).toHaveLength(2);
    expect(result.current.artifacts.find(a => a.id === artifactToDelete.id)).toBeUndefined();
    expect(result.current.selectedArtifact).toBeNull();
  });

  it('should handle refresh/fetchArtifacts', async () => {
    // Setup mocks
    const initialArtifacts = createMockArtifacts(2);
    const refreshedArtifacts = [...initialArtifacts, createMockArtifact({ id: 'new-artifact' })];

    vi.mocked(artifactApi.getAllArtifacts)
      .mockResolvedValueOnce(initialArtifacts)
      .mockResolvedValueOnce(refreshedArtifacts);

    // Render the hook
    const { result } = renderHook(() => useArtifacts());

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Initial state should have 2 artifacts
    expect(result.current.artifacts).toHaveLength(2);

    // Call fetchArtifacts manually
    await act(async () => {
      await result.current.fetchArtifacts();
    });

    // Should now have 3 artifacts
    expect(result.current.artifacts).toHaveLength(3);
    expect(artifactApi.getAllArtifacts).toHaveBeenCalledTimes(2);
  });
});