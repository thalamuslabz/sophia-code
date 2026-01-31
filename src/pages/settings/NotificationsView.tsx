import { Webhook, MessageCircle, Mail, Globe } from 'lucide-react';

export const NotificationsView = () => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-display font-bold text-white mb-4">Channel Configuration</h3>
        <div className="space-y-4">
          {[
            { name: "Slack Alerts", icon: MessageCircle, connected: true, dest: "#ops-alerts" },
            { name: "Telegram Bot", icon: Globe, connected: false, dest: "@sophia_bot" },
            { name: "Email Digest", icon: Mail, connected: true, dest: "admin@cognexa.ai" },
            { name: "Custom Webhook", icon: Webhook, connected: true, dest: "https://api.internal/hooks/sophia" },
          ].map((channel, i) => (
             <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
               <div className="flex items-center gap-4">
                 <div className="p-2 rounded-lg bg-black/40 text-white/70">
                   <channel.icon className="w-5 h-5" />
                 </div>
                 <div>
                   <h4 className="font-bold text-white text-sm">{channel.name}</h4>
                   <p className="text-xs font-mono text-muted-foreground">{channel.dest}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${channel.connected ? 'text-secondary' : 'text-white/20'}`}>
                    {channel.connected ? 'Active' : 'Inactive'}
                  </span>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${channel.connected ? 'bg-secondary/20' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 bottom-1 w-3 h-3 rounded-full transition-all ${channel.connected ? 'left-6 bg-secondary shadow-[0_0_10px_rgba(0,240,255,0.8)]' : 'left-1 bg-white/30'}`}></div>
                  </div>
               </div>
             </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-display font-bold text-white mb-4">Event Subscriptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {['Critical System Failures', 'Governance Violations', 'Budget Threshold Exceeded', 'New Integration Connected', 'Weekly Performance Reports', 'Security Audit Logs'].map((event, i) => (
             <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
               <div className={`w-4 h-4 rounded border flex items-center justify-center ${i < 3 ? 'bg-secondary border-secondary' : 'border-white/30'}`}>
                 {i < 3 && <div className="w-2 h-2 rounded-sm bg-black/80"></div>}
               </div>
               <span className="text-sm text-white/80">{event}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
