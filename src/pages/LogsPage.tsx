import { MissionLayout } from '../components/layout/MissionLayout';
import { Download, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const LogsPage = () => {
  return (
    <MissionLayout>
      <div className="h-full flex flex-col space-y-6">
        <header className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">System Logs</h1>
            <p className="text-muted-foreground font-mono text-sm">RETENTION: 30_DAYS // MODE: VERBOSE</p>
          </div>
          <div className="flex gap-3">
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors font-mono text-xs font-bold uppercase">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </header>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden flex flex-col"
        >
          <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <div className="w-32">Timestamp</div>
            <div className="w-24">Level</div>
            <div className="w-32">Source</div>
            <div className="flex-1">Message</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs">
            {Array.from({ length: 15 }).map((_, i) => (
               <div key={i} className="flex items-start gap-4 hover:bg-white/5 p-1 rounded transition-colors cursor-default group">
                 <div className="w-32 text-white/30">{new Date(Date.now() - i * 60000).toISOString()}</div>
                 <div className={`w-24 font-bold ${i % 3 === 0 ? 'text-secondary' : i % 5 === 0 ? 'text-magenta' : 'text-blue-400'}`}>
                   {i % 3 === 0 ? 'SUCCESS' : i % 5 === 0 ? 'WARN' : 'INFO'}
                 </div>
                 <div className="w-32 text-white/60">SYSTEM_CORE</div>
                 <div className="flex-1 text-white/80 group-hover:text-white">
                   {i % 3 === 0 ? 'Operation completed successfully with 12ms latency' : i % 5 === 0 ? 'Governance check triggered on output stream' : 'Routine health check performed. All systems nominal.'}
                 </div>
               </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MissionLayout>
  );
};
