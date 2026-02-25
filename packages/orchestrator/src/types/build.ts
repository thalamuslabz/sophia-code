export type BuildStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

export interface BuildContext {
  buildId: string;
  project: string;
  intentId: string;
  workDir: string;
  artifactsDir: string;
  env: Record<string, string>;
}

export interface BuildConfig {
  image: string;
  steps: BuildStep[];
  env?: Record<string, string>;
  artifacts?: string[];
}

export interface BuildStep {
  name: string;
  command: string;
  workingDir?: string;
}

export interface BuildResult {
  buildId: string;
  status: BuildStatus;
  startedAt: string;
  completedAt?: string;
  steps: BuildStepResult[];
  error?: string;
}

export interface BuildStepResult {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  exitCode?: number;
  output?: string;
  error?: string;
}
