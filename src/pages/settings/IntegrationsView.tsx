import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Database, Link, Power, RefreshCw, Server, MessageSquare, Bot, Terminal, Braces, Settings, PenTool, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setVendor, selectVendor } from '../../store/slices/context.slice';
import type { AIProviderType } from '../../lib/ai/types';
import { env } from '../../config/env';

// Configuration dialog component
const ConfigureProviderDialog = ({
  provider,
  isOpen,
  onClose
}: {
  provider: { id: string; name: string; type: string; };
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');

  // Get the current environment variable value (for demo purposes)
  const getKeyName = (id: string) => `VITE_${id.toUpperCase()}_API_KEY`;
  const getEndpointName = (id: string) => `VITE_${id.toUpperCase()}_API_ENDPOINT`;

  const handleSave = () => {
    // In a real app, this would save to .env or a secure storage
    // For this demo, we'll just log it
    console.log('Saving configuration for', provider.name);
    console.log('API Key:', apiKey);
    console.log('API Endpoint:', apiEndpoint);

    // Close the dialog
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-white/10 p-6 rounded-lg shadow-lg max-w-md w-full"
      >
        <h2 className="text-xl font-bold mb-4">Configure {provider.name}</h2>
        <p className="text-sm text-gray-400 mb-6">Enter your API credentials for {provider.name}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Your ${provider.name} API Key`}
              className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Environment variable: {getKeyName(provider.id)}</p>
          </div>

          {['deepseek', 'kimi'].includes(provider.id) && (
            <div>
              <label className="block text-sm font-medium mb-1">API Endpoint (Optional)</label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder={`API Endpoint URL`}
                className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Environment variable: {getEndpointName(provider.id)}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const IntegrationsView = () => {
  // Get the current provider from Redux store
  const dispatch = useAppDispatch();
  const currentProvider = useAppSelector(selectVendor) as AIProviderType;

  // State for the configuration dialog
  const [configureProvider, setConfigureProvider] = useState<{ id: string; name: string; type: string } | null>(null);

  // Define the AI providers
  const aiProviders = [
    { id: 'anthropic', name: 'Anthropic Claude', type: 'AI Model', icon: Bot, color: 'text-orange-400' },
    { id: 'opencode', name: 'OpenCode Internal', type: 'AI Model', icon: Terminal, color: 'text-blue-400' },
    { id: 'deepseek', name: 'Deepseek Coder', type: 'AI Model', icon: Braces, color: 'text-emerald-400' },
    { id: 'kimi', name: 'Kimi Code', type: 'AI Model', icon: Sparkles, color: 'text-purple-400' },
  ];

  // Other integrations
  const otherIntegrations = [
    { id: 'postgres', name: 'PostgreSQL Core', type: 'Database', icon: Database, color: 'text-blue-400' },
    { id: 'vector', name: 'Vector Store', type: 'Database', icon: Server, color: 'text-purple-400' },
    { id: 'slack', name: 'Slack Bot', type: 'Communication', icon: MessageSquare, color: 'text-amber-400' },
    { id: 's3', name: 'S3 Storage', type: 'Storage', icon: Database, color: 'text-red-400' },
  ];

  // Function to check if a provider is active
  const isProviderActive = (id: string) => {
    return id === currentProvider;
  };

  // Function to activate a provider
  const activateProvider = (id: AIProviderType) => {
    dispatch(setVendor(id));
  };

  // Function to open the configuration dialog
  const openConfigDialog = (provider: { id: string; name: string; type: string }) => {
    setConfigureProvider(provider);
  };

  return (
    <div className="space-y-8">
      {/* AI Models Section */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          AI Provider Configuration
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Configure the AI providers for code generation and assistance. The active provider will be used for all AI operations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
          {aiProviders.map((provider, i) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-white/5 ${provider.color}`}>
                  <provider.icon className="w-6 h-6" />
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${isProviderActive(provider.id) ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isProviderActive(provider.id) ? 'bg-secondary animate-pulse' : 'bg-white/20'}`}></div>
                  {isProviderActive(provider.id) ? 'Active' : 'Inactive'}
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{provider.name}</h3>
              <p className="text-xs font-mono text-muted-foreground mb-6">{provider.type}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => openConfigDialog(provider)}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono font-bold uppercase transition-colors border border-white/5 hover:border-white/10"
                >
                  Configure
                </button>
                <button
                  onClick={() => activateProvider(provider.id as AIProviderType)}
                  className={`p-2 rounded-lg transition-colors border ${isProviderActive(provider.id) ? 'bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20' : 'bg-white/5 text-white/50 hover:bg-white/10 border-white/5'}`}
                  title={isProviderActive(provider.id) ? 'Active' : 'Set as active'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Other Integrations Section */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Link className="w-5 h-5 text-primary" />
          Other Integrations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {otherIntegrations.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-white/5 ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border bg-white/5 text-muted-foreground border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                  Disconnected
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
              <p className="text-xs font-mono text-muted-foreground mb-6">{item.type}</p>

              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono font-bold uppercase transition-colors border border-white/5 hover:border-white/10">
                  Configure
                </button>
                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-white/5 hover:border-white/10">
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

      {/* Configuration Dialog */}
      {configureProvider && (
        <ConfigureProviderDialog
          provider={configureProvider}
          isOpen={!!configureProvider}
          onClose={() => setConfigureProvider(null)}
        />
      )}
    </div>
  );
};
