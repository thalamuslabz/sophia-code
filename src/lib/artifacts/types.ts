export interface ArtifactMetadata {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  tags: string[];
}

export interface IntentArtifact extends ArtifactMetadata {
  kind: 'intent';
  promptTemplate: string;
  requiredContext: string[]; // e.g., ['code_diff', 'user_ticket']
  outputSchema?: any; // Zod schema for structured output
}

export interface GateArtifact extends ArtifactMetadata {
  kind: 'gate';
  evaluator: (context: any, streamChunk: string) => GateResult;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface GateResult {
  triggered: boolean;
  message?: string;
}

export type CognitiveArtifact = IntentArtifact | GateArtifact;
