import { useRef, useEffect } from 'react';
import { MissionLayout } from './components/layout/MissionLayout';
import { ArtifactExplorer } from './components/features/ArtifactExplorer';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckCircle2, XCircle, Terminal as TerminalIcon, Activity, ShieldCheck, AlertTriangle, Database } from 'lucide-react';
import { AIProviderFactory } from './lib/ai/factory';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  selectMissionStatus,
  selectLogs,
  selectTrustScore,
  setStatus,
  addLog,
  resetMission
} from './store/slices/mission.slice';
import {
  selectActiveGates,
  selectPendingGates,
  resolveGate
} from './store/slices/governance.slice';
import type { GovernanceGate } from './store/slices/governance.slice';
import { GovernanceEngine } from './lib/governance/engine';
import {
  setCurrentView,
  selectCurrentView
} from './store/slices/ui.slice';

const TerminalLine = ({ text, type = 'info' }: { text: string, type?: 'info' | 'success' | 'warning' | 'error' }) => {
  const colors = {
    info: 'text-blue-400',
    success: 'text-secondary', // Cyan
    warning: 'text-amber-400',
    error: 'text-destructive' // Pink/Red
  };
  
  return (
    <div className="font-mono text-sm py-0.5 flex items-start gap-3 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
      <span className="text-white/20 select-none">{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</span>
      <span className={colors[type]}>{text}</span>
    </div>
  );
};

const GateCard = ({ gate, onResolve }: { gate: GovernanceGate, onResolve: (approved: boolean) => void }) => {
  if (gate.status !== 'pending') return null;

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
    >
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-500 text-sm uppercase tracking-wider">Governance Gate Triggered</h4>
          <p className="text-sm text-white/80 mt-1">{gate.message}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 justify-end">
        <button 
          onClick={() => onResolve(false)}
          className="px-3 py-1.5 rounded text-xs font-bold uppercase text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all flex items-center gap-1"
        >
          <XCircle className="w-3 h-3" /> Reject
        </button>
        <button 
          onClick={() => onResolve(true)}
          className="px-3 py-1.5 rounded text-xs font-bold uppercase text-secondary bg-secondary/10 border border-secondary/30 hover:bg-secondary/20 transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        >
          <CheckCircle2 className="w-3 h-3" /> Approve
        </button>
      </div>
    </motion.div>
  );
};

export const AppContent = () => {
  // Redux hooks
  const dispatch = useAppDispatch();
  const logs = useAppSelector(selectLogs);
  const status = useAppSelector(selectMissionStatus);
  const trustScore = useAppSelector(selectTrustScore);
  const activeGates = useAppSelector(selectActiveGates);
  const pendingGates = useAppSelector(selectPendingGates);
  const view = useAppSelector(selectCurrentView);

  const provider = useRef(AIProviderFactory.getProvider());
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProcessing = status === 'planning' || status === 'executing';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStartMission = async () => {
    if (isProcessing) return;
    dispatch(resetMission());
    dispatch(setStatus('planning'));
    dispatch(addLog('Initializing Neural Core...', 'info'));

    try {
      dispatch(addLog(`Connecting to provider: ${provider.current.id}`, 'info'));

      // Simulate stream and governance check
      await new Promise(r => setTimeout(r, 1000));

      const stream = provider.current.streamText('Mission Start');
      let fullResponse = '';

      dispatch(setStatus('executing'));

      for await (const chunk of stream) {
        // Get current status (using getState pattern with selector)
        const currentStatus = useAppSelector(selectMissionStatus);

        // Check if we are paused/gated
        if (currentStatus === 'gated') {
          dispatch(addLog('Mission Paused: Waiting for Governance Resolution...', 'warning'));
          break; // Stop stream processing
        }

        // Run Governance Engine - now with dispatch instead of direct store access
        GovernanceEngine.analyzeStream(chunk, dispatch);

        // Get status again after governance check
        const updatedStatus = useAppSelector(selectMissionStatus);

        // If gate triggered during analysis, stop immediately
        if (updatedStatus === 'gated') {
           break;
        }

        fullResponse += chunk;
        // In a real app we would stream partials, here we just simulate logs periodically
      }

      // Final status check
      const finalStatus = useAppSelector(selectMissionStatus);

      if (finalStatus !== 'gated') {
        dispatch(addLog(fullResponse, 'success'));
        dispatch(setStatus('completed'));

        // Simulate a "bad" event for demo purposes if nothing happened
        if (activeGates.length === 0) {
           setTimeout(() => {
             dispatch(addLog('Simulating PII leak for demo...', 'info'));
             GovernanceEngine.analyzeStream('User email: admin@corp.com', dispatch);
           }, 2000);
        }
      }

    } catch (err) {
      dispatch(addLog('Mission failed: ' + (err as Error).message || String(err), 'error'));
      dispatch(setStatus('failed'));
    }
  };

  if (view === 'artifacts') {
     return (
       <MissionLayout>
         <ArtifactExplorer onClose={() => dispatch(setCurrentView('mission'))} />
       </MissionLayout>
     )
  }

  return (
    <MissionLayout>
       <div className="absolute top-4 right-4 z-50">
           <button onClick={() => dispatch(setCurrentView('artifacts'))} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white rounded-lg border border-white/10 font-medium text-xs transition-colors">
             <Database className="w-4 h-4" />
             Artifact Library
           </button>
       </div>

      <div className="grid grid-cols-12 gap-6 h-full pt-12">
        {/* Left Column: Live Feed */}
        <div className="col-span-8 flex flex-col gap-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
             <div>
               <h2 className="text-xl font-display font-bold text-white mb-1">Mission Status</h2>
               <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${status === 'executing' ? 'bg-secondary animate-pulse' : status === 'gated' ? 'bg-amber-500' : 'bg-white/20'}`}></span>
                 <p className="text-sm text-muted-foreground uppercase font-mono tracking-wider">{status}</p>
               </div>
             </div>
             
             <button 
               onClick={handleStartMission}
               disabled={isProcessing || status === 'gated'}
               className={`
                 group relative px-6 py-3 rounded-lg font-mono font-bold tracking-wider uppercase transition-all duration-300
                 ${status === 'gated' 
                   ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 cursor-not-allowed opacity-50'
                   : isProcessing 
                     ? 'bg-primary/10 text-primary border border-primary/50 cursor-wait' 
                     : 'bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                 }
               `}
             >
               <span className="flex items-center gap-2">
                 {isProcessing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                 {isProcessing ? 'EXECUTING...' : 'ENGAGE SYSTEM'}
               </span>
             </button>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <TerminalIcon className="w-3 h-3" />
                <span>LIVE_LOG_STREAM</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-secondary/20 border border-secondary/50"></div>
              </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
               {logs.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-white/20">
                   <Activity className="w-12 h-12 mb-4 opacity-20" />
                   <p>System Idle. Waiting for command.</p>
                 </div>
               )}
               {logs.map(log => (
                 <TerminalLine key={log.id} text={log.text} type={log.type} />
               ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Governance */}
        <div className="col-span-4 flex flex-col gap-6">
           <motion.div 
             initial={{ x: 20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
           >
             <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
               <ShieldCheck className="w-5 h-5 text-magenta" />
               Governance Gates
             </h3>
             
             <div className="space-y-2">
               <AnimatePresence>
                 {pendingGates.map(gate => (
                   <GateCard key={gate.id} gate={gate} onResolve={(approved) => dispatch(resolveGate(gate.id, approved))} />
                 ))}
               </AnimatePresence>

               {pendingGates.length === 0 && (
                 <div className="text-center py-8 opacity-40">
                   <CheckCircle2 className="w-8 h-8 text-magenta mx-auto mb-2" />
                   <p className="text-sm">Systems Nominal</p>
                 </div>
               )}
             </div>
           </motion.div>
           
           <motion.div 
             initial={{ x: 20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="flex-1 p-6 rounded-xl bg-gradient-to-b from-primary/5 to-transparent border border-primary/20 backdrop-blur-md flex flex-col items-center justify-center text-center relative overflow-hidden"
           >
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.1),transparent_70%)]"></div>
             
             <div className="relative z-10">
               <div className="text-5xl font-display font-bold text-white mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                 {trustScore}<span className="text-2xl text-primary/80">%</span>
               </div>
               <div className="text-xs font-mono uppercase tracking-widest text-primary/60">Trust Score</div>
             </div>
             
             <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">12ms</div>
                  <div className="text-[10px] text-white/40 uppercase">Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">$0.002</div>
                  <div className="text-[10px] text-white/40 uppercase">Cost</div>
                </div>
             </div>
           </motion.div>
        </div>
      </div>
    </MissionLayout>
  );
}

export default AppContent;

