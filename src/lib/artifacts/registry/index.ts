import type { CognitiveArtifact, IntentArtifact, GateArtifact } from '../types';

class ArtifactRegistry {
  private artifacts: Map<string, CognitiveArtifact> = new Map();

  register(artifact: CognitiveArtifact) {
    if (this.artifacts.has(artifact.id)) {
      console.warn(`Overwriting artifact ${artifact.id}`);
    }
    this.artifacts.set(artifact.id, artifact);
  }

  get(id: string): CognitiveArtifact | undefined {
    return this.artifacts.get(id);
  }

  getAll(): CognitiveArtifact[] {
    return Array.from(this.artifacts.values());
  }

  getIntents(): IntentArtifact[] {
    return this.getAll().filter(a => a.kind === 'intent') as IntentArtifact[];
  }

  getGates(): GateArtifact[] {
    return this.getAll().filter(a => a.kind === 'gate') as GateArtifact[];
  }
}

export const registry = new ArtifactRegistry();
