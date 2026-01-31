import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Shield, Eye, AlertTriangle } from 'lucide-react';

export const PoliciesView = () => {
  const policies = [
    { id: 'POL-001', name: 'PII Data Sanitization', level: 'Critical', active: true, description: 'Automatically detects and redacts email addresses, phone numbers, and SSNs from output streams.' },
    { id: 'POL-002', name: 'Code Execution Sandbox', level: 'Critical', active: true, description: 'Enforces containerization for all generated code execution. Network access restricted.' },
    { id: 'POL-003', name: 'Tone Consistency', level: 'Standard', active: false, description: 'Ensures agent responses maintain a professional and objective tone.' },
    { id: 'POL-004', name: 'Competitor Mention Guard', level: 'High', active: true, description: 'Flags or blocks mentions of known competitor products.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" />
          Add New Policy
        </button>
      </div>

      <div className="space-y-3">
        {policies.map((policy, i) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group flex items-start gap-4"
          >
            <div className={`p-3 rounded-lg bg-black/40 border border-white/5 ${policy.level === 'Critical' ? 'text-magenta' : policy.level === 'High' ? 'text-amber-400' : 'text-blue-400'}`}>
              <Shield className="w-5 h-5" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-white text-base">{policy.name}</h3>
                <span className="text-[10px] font-mono text-white/30 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{policy.id}</span>
                {policy.active ? (
                  <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20 uppercase">Active</span>
                ) : (
                  <span className="text-[10px] font-mono text-white/30 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase">Inactive</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{policy.description}</p>
              
              <div className="flex items-center gap-4 text-xs font-mono text-white/40">
                <div className="flex items-center gap-1.5">
                   <AlertTriangle className="w-3 h-3" />
                   Level: <span className={policy.level === 'Critical' ? 'text-magenta' : 'text-white'}>{policy.level}</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <Eye className="w-3 h-3" />
                   Scope: Global
                </div>
              </div>
            </div>

            <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
               <button className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                 <Edit2 className="w-4 h-4" />
               </button>
               <button className="p-2 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors">
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
