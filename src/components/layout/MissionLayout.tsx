import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Terminal, Cpu, Settings } from 'lucide-react';
import sophiaMascot from '../../assets/sophia-mascot.png';
import { useLocation, useNavigate } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, path, active = false }: { icon: any, label: string, path: string, active?: boolean }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(path)}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 group ${active ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-white/5 text-muted-foreground hover:text-white'}`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-primary drop-shadow-[0_0_5px_rgba(189,52,254,0.5)]' : 'group-hover:text-white'}`} />
      <span className="font-medium tracking-wide text-sm">{label}</span>
    </div>
  );
};

export const MissionLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Left Sidebar - Navigation & Status */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col p-4 z-20"
      >
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="relative group">
             <div className="absolute -inset-2 bg-gradient-to-tr from-primary via-secondary to-primary rounded-full blur-md opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
             <img 
               src={sophiaMascot} 
               alt="SOPHIA" 
               className="relative w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-transform duration-500 group-hover:scale-110" 
             />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">SOPHIA</h1>
            <span className="text-[10px] uppercase tracking-widest text-primary/80 font-mono font-medium">Mission Control</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={Activity} label="Live Operations" path="/" active={location.pathname === '/'} />
          <SidebarItem icon={Cpu} label="Neural Core" path="/neural-core" active={location.pathname === '/neural-core'} />
          <SidebarItem icon={ShieldCheck} label="Governance" path="/governance" active={location.pathname === '/governance'} />
          <SidebarItem icon={Terminal} label="System Logs" path="/logs" active={location.pathname === '/logs'} />
          
          <div className="pt-4 mt-4 border-t border-white/5">
            <SidebarItem icon={Settings} label="Configuration" path="/settings" active={location.pathname.startsWith('/settings')} />
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
            <span className="text-xs font-mono text-secondary tracking-widest uppercase">System Online</span>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
             <span>MISSION</span>
             <span className="text-white/20">/</span>
             <span className="text-primary">ACTIVE_CONTEXT</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-mono text-primary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                OPENCODE::V1
             </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none"></div>
          {children}
        </div>
      </main>
    </div>
  );
};
