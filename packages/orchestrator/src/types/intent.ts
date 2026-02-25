export type { Intent } from '../schemas/intent.js';
export type IntentStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'failed';

export interface IntentCreateInput {
  project: string;
  author: string;
  description: string;
  contractRef?: string;
  contractHash?: string;
  acceptanceCriteria: string[];
  outOfScope?: string[];
}

export interface IntentFilter {
  project?: string;
  status?: IntentStatus;
  author?: string;
}
