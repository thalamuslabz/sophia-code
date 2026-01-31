import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, Code, ArrowRight, X, Tag, FileText, Zap, AlertTriangle } from 'lucide-react';
import { registry } from '../../lib/artifacts';
import type { CognitiveArtifact } from '../../lib/artifacts/types';

export const ArtifactExplorer = ({ onClose }: { onClose: () => void }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'intent' | 'gate'>('all');
  const [selectedArtifact, setSelectedArtifact] = useState<CognitiveArtifact | null>(null);

  const artifacts = registry.getAll().filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                          a.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || a.kind === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full bg-background text-foreground relative">
      {/* Search Header */}
      <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-xl sticky top-0 z-10 flex items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-xl">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="Search cognitive artifacts..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
             />
          </div>
          <div className="flex bg-black/20 p-1 rounded-lg border border-white/10">
            {['all', 'intent', 'gate'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary/20 text-primary shadow-sm' : 'text-muted-foreground hover:text-white'}`}
              >
                {f}s
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artifacts.map((artifact) => (
            <ArtifactCard 
              key={artifact.id} 
              artifact={artifact} 
              onClick={() => setSelectedArtifact(artifact)}
            />
          ))}
        </div>
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
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedArtifact.kind === 'intent' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                       {selectedArtifact.kind}
                     </span>
                     <span className="text-xs font-mono text-muted-foreground">v{selectedArtifact.version}</span>
                   </div>
                   <h2 className="text-2xl font-bold text-white">{selectedArtifact.name}</h2>
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

                 {selectedArtifact.kind === 'intent' && (
                   <div className="space-y-6">
                     <div>
                       <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                         <Zap className="w-3 h-3" /> Prompt Template
                       </h3>
                       <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-blue-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                         {(selectedArtifact as any).promptTemplate || '// No template available'}
                       </div>
                     </div>
                     
                     <div>
                        <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Required Context</h3>
                        <div className="flex flex-wrap gap-2">
                          {((selectedArtifact as any).requiredContext || []).map((ctx: string) => (
                             <span key={ctx} className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20 font-mono">
                               {ctx}
                             </span>
                          ))}
                        </div>
                     </div>
                   </div>
                 )}

                 {selectedArtifact.kind === 'gate' && (
                   <div>
                     <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                       <AlertTriangle className="w-3 h-3" /> Severity
                     </h3>
                     <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${(selectedArtifact as any).severity === 'critical' ? 'bg-magenta/20 text-magenta' : 'bg-amber-500/20 text-amber-500'}`}>
                       {(selectedArtifact as any).severity || 'Standard'}
                     </span>
                   </div>
                 )}
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5">
                <button className="w-full py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all text-sm font-bold uppercase">
                  Deploy Artifact
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ArtifactCard = ({ artifact, onClick }: { artifact: CognitiveArtifact, onClick: () => void }) => {
  const isIntent = artifact.kind === 'intent';
  const Icon = isIntent ? Code : Shield;
  const colorClass = isIntent ? 'text-blue-400' : 'text-emerald-400';
  const bgClass = isIntent ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group cursor-pointer flex flex-col h-full hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{artifact.kind}</span>
      </div>

      <h3 className="font-bold text-lg text-white mb-2 group-hover:text-primary transition-colors">{artifact.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">{artifact.description}</p>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
         <div className="flex gap-2">
           {artifact.tags.slice(0, 2).map(tag => (
             <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/50">{tag}</span>
           ))}
         </div>
         <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
};

