import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BuildAgent } from './build-agent';
import fs from 'fs';
import path from 'path';

describe('BuildAgent', () => {
  const testWorkDir = './test-build-work';
  let agent: BuildAgent;

  beforeEach(() => {
    if (fs.existsSync(testWorkDir)) {
      fs.rmSync(testWorkDir, { recursive: true });
    }
    agent = new BuildAgent(testWorkDir);
  });

  afterEach(() => {
    if (fs.existsSync(testWorkDir)) {
      fs.rmSync(testWorkDir, { recursive: true });
    }
  });

  it('should generate build id with correct format', () => {
    const buildId = agent.generateBuildId('ASO');
    expect(buildId).toMatch(/^aso-\d{8}-[a-z0-9]{7}$/);
  });

  it('should prepare build with correct directory structure', () => {
    const config = {
      image: 'node:20-alpine',
      steps: [{ name: 'test', command: 'echo test' }]
    };

    const context = agent.prepareBuild('ASO', 'int-123', config);

    expect(context.buildId).toMatch(/^aso-\d{8}-[a-z0-9]{7}$/);
    expect(context.project).toBe('ASO');
    expect(context.intentId).toBe('int-123');
    expect(fs.existsSync(context.workDir)).toBe(true);
    expect(fs.existsSync(context.artifactsDir)).toBe(true);
    expect(fs.existsSync(path.join(context.workDir, 'build-config.json'))).toBe(true);
  });

  it('should include required environment variables in context', () => {
    const config = {
      image: 'node:20-alpine',
      steps: [{ name: 'test', command: 'echo test' }],
      env: { CUSTOM_VAR: 'custom_value' }
    };

    const context = agent.prepareBuild('ASO', 'int-123', config);

    expect(context.env.BUILD_ID).toBe(context.buildId);
    expect(context.env.PROJECT).toBe('ASO');
    expect(context.env.INTENT_ID).toBe('int-123');
    expect(context.env.WORK_DIR).toBe('/workspace');
    expect(context.env.ARTIFACTS_DIR).toBe('/workspace/artifacts');
    expect(context.env.CUSTOM_VAR).toBe('custom_value');
  });
});
