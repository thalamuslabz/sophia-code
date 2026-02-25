import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { BuildContext, BuildConfig, BuildResult, BuildStepResult, BuildStatus } from '../types/build.js';

export class BuildAgent {
  private baseWorkDir: string;

  constructor(baseWorkDir: string) {
    this.baseWorkDir = baseWorkDir;
    this.ensureWorkDirectory();
  }

  private ensureWorkDirectory(): void {
    if (!fs.existsSync(this.baseWorkDir)) {
      fs.mkdirSync(this.baseWorkDir, { recursive: true });
    }
  }

  generateBuildId(project: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString(36).slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${project.toLowerCase()}-${date}-${timestamp}${random}`;
  }

  prepareBuild(project: string, intentId: string, config: BuildConfig): BuildContext {
    const buildId = this.generateBuildId(project);
    const workDir = path.join(this.baseWorkDir, buildId);
    const artifactsDir = path.join(workDir, 'artifacts');

    fs.mkdirSync(workDir, { recursive: true });
    fs.mkdirSync(artifactsDir, { recursive: true });

    fs.writeFileSync(
      path.join(workDir, 'build-config.json'),
      JSON.stringify(config, null, 2)
    );

    return {
      buildId,
      project,
      intentId,
      workDir,
      artifactsDir,
      env: {
        ...config.env,
        BUILD_ID: buildId,
        PROJECT: project,
        INTENT_ID: intentId,
        WORK_DIR: '/workspace',
        ARTIFACTS_DIR: '/workspace/artifacts'
      }
    };
  }

  async runBuild(context: BuildContext, config: BuildConfig): Promise<BuildResult> {
    const startedAt = new Date().toISOString();
    const stepResults: BuildStepResult[] = [];
    let status: BuildStatus = 'running';

    try {
      for (const step of config.steps) {
        const stepResult = await this.executeStep(context, step, config.image);
        stepResults.push(stepResult);

        if (stepResult.status === 'failed') {
          status = 'failed';
          break;
        }
      }

      if (status !== 'failed') {
        status = 'success';
      }
    } catch (error) {
      status = 'failed';
    }

    const completedAt = new Date().toISOString();

    return {
      buildId: context.buildId,
      status,
      startedAt,
      completedAt,
      steps: stepResults
    };
  }

  executeStep(context: BuildContext, step: { name: string; command: string; workingDir?: string }, image: string): Promise<BuildStepResult> {
    return new Promise((resolve) => {
      const startedAt = new Date().toISOString();

      const dockerArgs = [
        'run',
        '--rm',
        '-v', `${context.workDir}:/workspace`,
        '-w', step.workingDir || '/workspace',
        ...Object.entries(context.env).flatMap(([key, value]) => ['-e', `${key}=${value}`]),
        image,
        'sh', '-c', step.command
      ];

      const child = spawn('docker', dockerArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (exitCode) => {
        const completedAt = new Date().toISOString();
        const success = exitCode === 0;

        resolve({
          name: step.name,
          status: success ? 'success' : 'failed',
          startedAt,
          completedAt,
          exitCode: exitCode ?? undefined,
          output: output || undefined,
          error: errorOutput || undefined
        });
      });

      child.on('error', (error) => {
        const completedAt = new Date().toISOString();
        resolve({
          name: step.name,
          status: 'failed',
          startedAt,
          completedAt,
          error: error.message
        });
      });
    });
  }
}
