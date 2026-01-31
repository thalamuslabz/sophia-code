import { motion } from 'framer-motion';
import { Database, Link, Power, RefreshCw, Server, MessageSquare, Bot } from 'lucide-react';

export const IntegrationsView = () => {
  const integrations = [
    { name: 'PostgreSQL Core', type: 'Database', status: 'connected', icon: Database, color: 'text-blue-400' },
    { name: 'OpenAI GPT-4', type: 'AI Model', status: 'connected', icon: Bot, color: 'text-emerald-400' },
    { name: 'Vector Store', type: 'Database', status: 'connected', icon: Server, color: 'text-purple-400' },
    { name: 'Slack Bot', type: 'Communication', status: 'disconnected', icon: MessageSquare, color: 'text-amber-400' },
    { name: 'Anthropic Claude', type: 'AI Model', status: 'connected', icon: Bot, color: 'text-orange-400' },
    { name: 'S3 Storage', type: 'Storage', status: 'disconnected', icon: Database, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-white/5 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${item.status === 'connected' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'connected' ? 'bg-secondary animate-pulse' : 'bg-white/20'}`}></div>
                {item.status}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
            <p className="text-xs font-mono text-muted-foreground mb-6">{item.type}</p>
            
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono font-bold uppercase transition-colors border border-white/5 hover:border-white/10">
                Configure
              </button>
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-white/5 hover:border-white/10">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className={`p-2 rounded-lg transition-colors border ${item.status === 'connected' ? 'bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20' : 'bg-white/5 text-white/50 hover:bg-white/10 border-white/5'}`}>
                <Power className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] group"
          >
            <div className="p-4 rounded-full bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-colors mb-4">
              <Link className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Connect New Integration</h3>
          </motion.div>
      </div>
    </div>
  );
};
