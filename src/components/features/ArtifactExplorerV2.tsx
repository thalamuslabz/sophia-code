import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, X, Tag, FileText, Loader2 } from 'lucide-react';
import { useArtifacts } from '../../hooks/useArtifacts';
import type { Artifact } from '../../types';
import { GlassCard } from '../ui/GlassCard';

export const ArtifactExplorer = ({ onClose }: { onClose: () => void }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'intent' | 'gate' | 'contract'>('all');

  const {
    artifacts,
    loading,
    error,
    selectedArtifact,
    setSelectedArtifact,
    deleteArtifact
  } = useArtifacts();

  // Filter artifacts based on search and filter type
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                           a.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || a.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [artifacts, search, filter]);

  // Handle artifact copy
  const handleCopy = useCallback((artifact: Artifact) => {
    // In the future, this could copy the artifact to the clipboard or duplicate it
    console.log('Copying artifact:', artifact.id);
    // For now, just show an alert
    alert(`Copied artifact: ${artifact.title}`);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background text-foreground relative">
      {/* Search Header */}
      <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-xl sticky top-0 z-10 flex items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search artifacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex bg-black/20 p-1 rounded-lg border border-white/10">
            {['all', 'intent', 'gate', 'contract'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary/20 text-primary shadow-sm' : 'text-muted-foreground hover:text-white'}`}
              >
                {f === 'all' ? 'All' : f + 's'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
          title="Close Library"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-2 text-primary">Loading artifacts...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 mb-4">
            <h3 className="font-bold">Error loading artifacts</h3>
            <p className="text-sm">{error.message}</p>
            <button
              className="mt-2 text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-md transition-colors"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredArtifacts.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-gray-400 mb-4">No artifacts found matching your search criteria.</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Show all artifacts
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredArtifacts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArtifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                onCopy={handleCopy}
                onClick={() => setSelectedArtifact(artifact)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Slide-over */}
      <AnimatePresence>
        {selectedArtifact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArtifact(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-[#0A0E17] border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTypeClasses(selectedArtifact.type)}`}>
                      {selectedArtifact.type}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">ID: {selectedArtifact.id.slice(0, 8)}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedArtifact.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Description
                  </h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {selectedArtifact.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArtifact.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded bg-white/5 text-xs text-white/60 border border-white/5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trust Score */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Trust Score
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getTrustScoreColor(selectedArtifact.trustScore)}`}
                        style={{ width: `${selectedArtifact.trustScore}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${getTrustScoreTextColor(selectedArtifact.trustScore)}`}>
                      {selectedArtifact.trustScore}%
                    </span>
                  </div>
                </div>

                {/* Author Information */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Author
                  </h3>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-xs font-bold">
                      {selectedArtifact.author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{selectedArtifact.author.name}</span>
                        {selectedArtifact.author.verified && (
                          <span className="text-accent" title="Verified">✓</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">Author ID: {selectedArtifact.id.slice(0, 6)}</span>
                    </div>
                  </div>
                </div>

                {/* Content Hash */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Content Hash
                  </h3>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5 font-mono text-xs text-gray-400 break-all">
                    {selectedArtifact.contentHash || 'No content hash available'}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex gap-2">
                <button
                  onClick={() => handleCopy(selectedArtifact)}
                  className="flex-1 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all text-sm font-medium"
                >
                  Copy Artifact
                </button>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this artifact?')) {
                      deleteArtifact(selectedArtifact.id);
                    }
                  }}
                  className="py-2 px-4 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ArtifactCard = ({
  artifact,
  onCopy,
  onClick
}: {
  artifact: Artifact,
  onCopy: (artifact: Artifact) => void,
  onClick: () => void
}) => {
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'intent': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'gate': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'contract': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    onCopy(artifact);
  };

  return (
    <GlassCard hoverEffect className="flex flex-col gap-4 h-full cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(artifact.type)} uppercase tracking-wider`}>
          {artifact.type}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Trust</span>
          <span className={`font-bold ${getTrustColor(artifact.trustScore)}`}>{artifact.trustScore}%</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-1">{artifact.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2">{artifact.description}</p>
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-glass-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-[10px] font-bold">
            {artifact.author.name.charAt(0)}
          </div>
          <span className="text-xs text-gray-300">{artifact.author.name}</span>
          {artifact.author.verified && (
            <span className="text-accent" title="Verified">✓</span>
          )}
        </div>

        <button
          onClick={handleCopyClick}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium border border-white/10 transition-colors"
        >
          Copy Code
        </button>
      </div>
    </GlassCard>
  );
};

// Helper functions
function getTypeClasses(type: string): string {
  switch (type) {
    case 'intent': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'gate': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'contract': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  }
}

function getTrustScoreColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getTrustScoreTextColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  return 'text-red-400';
}