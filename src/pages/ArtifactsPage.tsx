import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useArtifacts } from '../hooks/useArtifacts';
import { ArtifactExplorer } from '../components/features/ArtifactExplorerV2';
import { ArtifactForm } from '../components/features/ArtifactForm';
import type { Artifact } from '../types';

export const ArtifactsPage = () => {
  const {
    createArtifact,
    updateArtifact
  } = useArtifacts();

  const [showForm, setShowForm] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<Artifact | undefined>(undefined);

  // Handler for form submission
  const handleSubmit = async (values: Omit<Artifact, 'id' | 'contentHash'> & { id?: string }) => {
    if (values.id) {
      // Update existing artifact
      await updateArtifact(values.id, values);
    } else {
      // Create new artifact
      await createArtifact(values as Omit<Artifact, 'id'>);
    }

    // Close the form
    setShowForm(false);
    setEditingArtifact(undefined);
  };

  // Handler to open form for creating a new artifact
  const handleCreateNew = () => {
    setEditingArtifact(undefined);
    setShowForm(true);
  };

  // Handler to close the form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingArtifact(undefined);
  };

  return (
    <div className="h-full relative">
      <ArtifactExplorer onClose={() => {}} />

      {/* Floating Action Button */}
      <button
        onClick={handleCreateNew}
        className="fixed right-8 bottom-8 p-4 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-3xl"
            >
              <ArtifactForm
                artifact={editingArtifact}
                onSubmit={handleSubmit}
                onCancel={handleCloseForm}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};