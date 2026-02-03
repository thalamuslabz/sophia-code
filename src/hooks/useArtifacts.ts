import { useState, useEffect, useCallback } from 'react';
import { artifactApi } from '../lib/api';
import type { Artifact } from '../types';

/**
 * Custom hook for managing artifacts from the API
 */
export function useArtifacts() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // Fetch all artifacts
  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await artifactApi.getAllArtifacts();
      setArtifacts(data);
    } catch (err) {
      console.error('Error fetching artifacts:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch artifacts'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Get artifact by ID
  const getArtifactById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await artifactApi.getArtifactById(id);
      setSelectedArtifact(data);
      return data;
    } catch (err) {
      console.error(`Error fetching artifact ${id}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to fetch artifact ${id}`));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new artifact
  const createArtifact = useCallback(async (artifactData: Omit<Artifact, 'id'>) => {
    setLoading(true);
    setError(null);

    try {
      const data = await artifactApi.createArtifact(artifactData);
      setArtifacts(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating artifact:', err);
      setError(err instanceof Error ? err : new Error('Failed to create artifact'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing artifact
  const updateArtifact = useCallback(async (id: string, artifactData: Partial<Artifact>) => {
    setLoading(true);
    setError(null);

    try {
      const data = await artifactApi.updateArtifact(id, artifactData);
      setArtifacts(prev => prev.map(a => (a.id === id ? data : a)));

      // Update selected artifact if it's the one being edited
      if (selectedArtifact?.id === id) {
        setSelectedArtifact(data);
      }

      return data;
    } catch (err) {
      console.error(`Error updating artifact ${id}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to update artifact ${id}`));
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedArtifact]);

  // Delete an artifact
  const deleteArtifact = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await artifactApi.deleteArtifact(id);
      setArtifacts(prev => prev.filter(a => a.id !== id));

      // Clear selected artifact if it's the one being deleted
      if (selectedArtifact?.id === id) {
        setSelectedArtifact(null);
      }

      return true;
    } catch (err) {
      console.error(`Error deleting artifact ${id}:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to delete artifact ${id}`));
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedArtifact]);

  // Fetch artifacts on mount
  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  return {
    artifacts,
    loading,
    error,
    selectedArtifact,
    setSelectedArtifact,
    fetchArtifacts,
    getArtifactById,
    createArtifact,
    updateArtifact,
    deleteArtifact
  };
}