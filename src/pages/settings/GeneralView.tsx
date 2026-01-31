import { Sliders, Save, RotateCcw } from 'lucide-react';

export const GeneralView = () => {
  return (
    <div className="space-y-8">
      <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10">
         <h3 className="font-display font-bold text-white text-lg mb-6 flex items-center gap-2">
           <Sliders className="w-5 h-5 text-secondary" />
           Environment Variables
         </h3>
         
         <div className="space-y-4">
           {[
             { label: "SOPHIA_INSTANCE_ID", value: "prod-us-east-1-004", locked: true },
             { label: "MAX_CONTEXT_TOKENS", value: "128000", locked: false },
             { label: "LOG_RETENTION_DAYS", value: "30", locked: false },
             { label: "DEFAULT_TEMP", value: "0.7", locked: false },
             { label: "GOVERNANCE_MODE", value: "STRICT_ENFORCEMENT", locked: false },
           ].map((v, i) => (
             <div key={i} className="grid grid-cols-12 gap-4 items-center">
               <div className="col-span-4 text-xs font-mono text-muted-foreground uppercase tracking-wider text-right pr-4 pt-1">
                 {v.label}
               </div>
               <div className="col-span-8">
                 <input 
                   type="text" 
                   value={v.value} 
                   disabled={v.locked}
                   className={`w-full bg-black/40 border ${v.locked ? 'border-white/5 text-white/30 cursor-not-allowed' : 'border-white/10 text-white focus:border-secondary/50'} rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors`}
                 />
               </div>
             </div>
           ))}
         </div>
      </div>
      
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
        <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-bold uppercase transition-colors flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset Defaults
        </button>
        <button className="px-6 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] text-xs font-bold uppercase transition-all flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
};
