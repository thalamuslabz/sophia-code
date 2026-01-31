import { MissionLayout } from '../components/layout/MissionLayout';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const GovernancePage = () => {
  return (
    <MissionLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Governance Protocols</h1>
            <p className="text-muted-foreground font-mono text-sm">ENFORCEMENT_LEVEL: STRICT // ACTIVE_POLICIES: 14</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
             <h3 className="font-display font-bold text-white mb-6 flex items-center gap-2">
               <Lock className="w-5 h-5 text-magenta" />
               Security Boundaries
             </h3>
             <div className="space-y-4">
                {[
                  { name: "PII Detection", status: "Active", level: "High" },
                  { name: "Output Sanitization", status: "Active", level: "High" },
                  { name: "Code Execution Sandbox", status: "Active", level: "Critical" },
                  { name: "External API Access", status: "Restricted", level: "Medium" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-sm font-medium text-white/90">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-magenta">{item.level.toUpperCase()}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
             </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
             <h3 className="font-display font-bold text-white mb-6 flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-amber-500" />
               Recent Interventions
             </h3>
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-lg bg-black/20">
                <ShieldCheck className="w-12 h-12 text-white/10 mb-3" />
                <p className="text-muted-foreground text-sm">No critical interventions in the last 24 hours.</p>
             </div>
          </motion.div>
        </div>
      </div>
    </MissionLayout>
  );
};
