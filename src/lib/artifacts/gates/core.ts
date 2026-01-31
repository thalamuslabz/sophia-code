import type { GateArtifact } from '../types';

const PII_PATTERN = /\b(\d{3}-\d{2}-\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;
const SECRET_PATTERN = /(api_key|secret|password|token).{0,20}['"][a-zA-Z0-9]{10,}['"]/i;

export const PIIGate: GateArtifact = {
  id: 'gate.core.pii',
  version: '1.0.0',
  kind: 'gate',
  name: 'PII Shield',
  description: 'Blocks output containing potential Personally Identifiable Information.',
  author: 'System',
  tags: ['security', 'compliance'],
  severity: 'high',
  evaluator: (_context, chunk) => {
    if (PII_PATTERN.test(chunk)) {
      return { triggered: true, message: 'PII detected in output stream.' };
    }
    return { triggered: false };
  }
};

export const SecretGate: GateArtifact = {
  id: 'gate.core.secrets',
  version: '1.0.0',
  kind: 'gate',
  name: 'Secret Scanner',
  description: 'Prevents leakage of API keys and secrets.',
  author: 'System',
  tags: ['security', 'critical'],
  severity: 'critical',
  evaluator: (_context, chunk) => {
    if (SECRET_PATTERN.test(chunk)) {
      return { triggered: true, message: 'Potential secret/key detected.' };
    }
    return { triggered: false };
  }
};
