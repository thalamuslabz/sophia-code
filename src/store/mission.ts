import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type MissionStatus = 'idle' | 'planning' | 'executing' | 'gated' | 'completed' | 'failed';

export interface LogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  metadata?: any;
}

export interface GovernanceGate {
  id: string;
  type: 'pii' | 'security' | 'budget' | 'human_approval';
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface MissionState {
  status: MissionStatus;
  trustScore: number;
  logs: LogEntry[];
  activeGates: GovernanceGate[];
  context: {
    missionId: string | null;
    vendor: string;
    metrics: {
      latency: number;
      cost: number;
    };
  };
  
  // Actions
  addLog: (text: string, type?: LogEntry['type']) => void;
  setStatus: (status: MissionStatus) => void;
  triggerGate: (gate: Omit<GovernanceGate, 'status'>) => void;
  resolveGate: (gateId: string, approved: boolean) => void;
  updateMetrics: (latency: number, cost: number) => void;
  resetMission: () => void;
}

export const useMissionStore = create<MissionState>()(
  immer((set) => ({
    status: 'idle',
    trustScore: 100,
    logs: [],
    activeGates: [],
    context: {
      missionId: null,
      vendor: 'opencode',
      metrics: { latency: 0, cost: 0 }
    },

    addLog: (text, type = 'info') => 
      set((state) => {
        state.logs.push({
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
          text,
          type
        });
      }),

    setStatus: (status) => 
      set((state) => {
        state.status = status;
      }),

    triggerGate: (gate) => 
      set((state) => {
        state.activeGates.push({ ...gate, status: 'pending' });
        state.status = 'gated'; // Automatically pause mission
        state.trustScore -= 5; // Slight penalty for hitting a gate
        
        state.logs.push({
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
          text: `Governance Gate Triggered: ${gate.message}`,
          type: 'warning'
        });
      }),

    resolveGate: (gateId, approved) => 
      set((state) => {
        const gate = state.activeGates.find(g => g.id === gateId);
        if (gate) {
          gate.status = approved ? 'approved' : 'rejected';
          
          if (approved) {
             state.status = 'executing'; // Resume mission
             state.trustScore += 2; // Regain trust on approval
             state.logs.push({
               id: Math.random().toString(36).substring(7),
               timestamp: Date.now(),
               text: `Gate Approved: Resuming mission.`,
               type: 'success'
             });
          } else {
             state.status = 'failed';
             state.logs.push({
               id: Math.random().toString(36).substring(7),
               timestamp: Date.now(),
               text: `Gate Rejected: Mission aborted.`,
               type: 'error'
             });
          }
        }
      }),

    updateMetrics: (latency, cost) =>
      set((state) => {
        state.context.metrics = { latency, cost };
      }),

    resetMission: () => 
      set((state) => {
        state.status = 'idle';
        state.logs = [];
        state.activeGates = [];
        state.trustScore = 100;
        state.context.missionId = Math.random().toString(36).substring(7);
      })
  }))
);
