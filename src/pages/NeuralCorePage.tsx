import { MissionLayout } from '../components/layout/MissionLayout';
import { Cpu, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const NeuralCorePage = () => {
  return (
    <MissionLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Neural Core</h1>
            <p className="text-muted-foreground font-mono text-sm">SYSTEM_ID: SOPHIA-CORE-V1 // PROCESSING_NODES: ACTIVE</p>
          </div>
          <div className="px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 text-secondary font-mono text-xs flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse" />
            OPTIMAL_PERFORMANCE
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Neural Activity Monitor */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="col-span-2 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md min-h-[400px] flex flex-col"
          >
            <h3 className="font-display font-bold text-white mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-secondary" />
              Active Context Threads
            </h3>
            
            <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-black/20 relative overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full border border-secondary/20 animate-[spin_10s_linear_infinite]"></div>
                  <div className="w-48 h-48 rounded-full border border-secondary/30 absolute animate-[spin_15s_linear_infinite_reverse]"></div>
                  <div className="w-32 h-32 rounded-full border border-secondary/40 absolute animate-[spin_5s_linear_infinite]"></div>
               </div>
               <span className="relative z-10 font-mono text-xs text-secondary/60">VISUALIZATION_FEED_PENDING</span>
            </div>
          </motion.div>

          {/* Core Metrics */}
          <div className="space-y-6">
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-md"
            >
               <h4 className="text-sm font-mono text-muted-foreground mb-4 uppercase">Token Throughput</h4>
               <div className="text-4xl font-display font-bold text-white mb-1">4.2k<span className="text-lg text-white/40 ml-1">t/s</span></div>
               <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-4">
                 <div className="h-full bg-secondary w-[75%] rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
               </div>
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-md"
            >
               <h4 className="text-sm font-mono text-muted-foreground mb-4 uppercase">Latency</h4>
               <div className="text-4xl font-display font-bold text-white mb-1">12<span className="text-lg text-white/40 ml-1">ms</span></div>
               <div className="flex items-center gap-2 text-xs text-emerald-400 mt-2 font-mono">
                 <Zap className="w-3 h-3" />
                 -2ms vs avg
               </div>
            </motion.div>
          </div>
        </div>
      </div>
    </MissionLayout>
  );
};
