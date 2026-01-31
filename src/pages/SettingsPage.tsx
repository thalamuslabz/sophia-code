import { useState } from 'react';
import { MissionLayout } from '../components/layout/MissionLayout';
import { Sliders, Database, Shield, Bell, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntegrationsView } from './settings/IntegrationsView';
import { PoliciesView } from './settings/PoliciesView';
import { NotificationsView } from './settings/NotificationsView';
import { GeneralView } from './settings/GeneralView';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'policies', label: 'Governance', icon: Shield },
    { id: 'notifications', label: 'Webhooks', icon: Bell },
    { id: 'admin', label: 'Access Control', icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return <GeneralView />;
      case 'integrations': return <IntegrationsView />;
      case 'policies': return <PoliciesView />;
      case 'notifications': return <NotificationsView />;
      default: return (
        <div className="flex flex-col items-center justify-center h-64 text-white/30">
           <Users className="w-12 h-12 mb-4 opacity-50" />
           <p className="font-mono text-sm">ADMIN_ACCESS_REQUIRED</p>
        </div>
      );
    }
  };

  return (
    <MissionLayout>
      <div className="flex flex-col h-full">
        <header className="flex-shrink-0 mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">System Configuration</h1>
          <p className="text-muted-foreground font-mono text-sm">ROOT_ACCESS: GRANTED // SESSION: SECURE</p>
        </header>

        <div className="flex-1 flex gap-8 overflow-hidden">
          {/* Settings Navigation */}
          <div className="w-64 flex-shrink-0 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  activeTab === tab.id 
                    ? 'text-white bg-white/10' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-lg shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                  />
                )}
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-secondary' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pr-4">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.2 }}
               >
                 {renderContent()}
               </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </div>
    </MissionLayout>
  );
};
