export interface ArtifactInfo {
  hash: string;
  size: number;
  path: string;
}

export interface BuildManifest {
  buildId: string;
  project: string;
  intentId: string;
  createdAt: string;
  files: Record<string, ArtifactInfo>;
  chainHash: string;
}

export interface EvidenceEntry {
  buildId: string;
  project: string;
  path: string;
  manifest: BuildManifest;
}
