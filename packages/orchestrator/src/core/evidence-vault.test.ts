import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EvidenceVault } from './evidence-vault';
import fs from 'fs';
import path from 'path';

describe('EvidenceVault', () => {
  const testVaultPath = './test-evidence-vault';
  let vault: EvidenceVault;

  beforeEach(() => {
    if (fs.existsSync(testVaultPath)) {
      fs.rmSync(testVaultPath, { recursive: true });
    }
    vault = new EvidenceVault(testVaultPath);
  });

  afterEach(() => {
    if (fs.existsSync(testVaultPath)) {
      fs.rmSync(testVaultPath, { recursive: true });
    }
  });

  it('should create build directory and write artifacts', () => {
    const buildPath = vault.createBuildDirectory('ASO', 'build-001');

    expect(fs.existsSync(buildPath)).toBe(true);
    expect(buildPath).toContain(path.join('ASO', 'build-001'));

    const content = Buffer.from('test artifact content');
    const artifact = vault.writeArtifact('ASO', 'build-001', 'test.txt', content);

    expect(artifact.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(artifact.size).toBe(content.length);
    expect(fs.existsSync(path.join(buildPath, 'test.txt'))).toBe(true);
  });

  it('should write and read manifest with integrity verification', () => {
    const content1 = Buffer.from('artifact one');
    const content2 = Buffer.from('artifact two');

    const artifact1 = vault.writeArtifact('ASO', 'build-002', 'file1.txt', content1);
    const artifact2 = vault.writeArtifact('ASO', 'build-002', 'file2.txt', content2);

    const manifest = {
      buildId: 'build-002',
      project: 'ASO',
      intentId: 'int-20240215-abc123',
      createdAt: new Date().toISOString(),
      files: {
        'file1.txt': artifact1,
        'file2.txt': artifact2
      },
      chainHash: ''
    };

    const crypto = require('crypto');
    const chainData = JSON.stringify({
      buildId: manifest.buildId,
      project: manifest.project,
      intentId: manifest.intentId,
      createdAt: manifest.createdAt,
      files: manifest.files
    });
    manifest.chainHash = crypto.createHash('sha256').update(chainData).digest('hex');

    vault.writeManifest(manifest);

    const retrieved = vault.readManifest('ASO', 'build-002');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.buildId).toBe('build-002');
    expect(retrieved?.files['file1.txt'].hash).toBe(artifact1.hash);

    const verification = vault.verifyIntegrity('ASO', 'build-002');
    expect(verification.valid).toBe(true);
    expect(verification.errors).toHaveLength(0);
  });

  it('should detect integrity violations', () => {
    const content = Buffer.from('original content');
    const artifact = vault.writeArtifact('ASO', 'build-003', 'file.txt', content);

    const manifest = {
      buildId: 'build-003',
      project: 'ASO',
      intentId: 'int-20240215-def456',
      createdAt: new Date().toISOString(),
      files: { 'file.txt': artifact },
      chainHash: ''
    };

    const crypto = require('crypto');
    const chainData = JSON.stringify({
      buildId: manifest.buildId,
      project: manifest.project,
      intentId: manifest.intentId,
      createdAt: manifest.createdAt,
      files: manifest.files
    });
    manifest.chainHash = crypto.createHash('sha256').update(chainData).digest('hex');

    vault.writeManifest(manifest);

    const buildPath = path.join(testVaultPath, 'ASO', 'build-003');
    fs.writeFileSync(path.join(buildPath, 'file.txt'), 'tampered content');

    const verification = vault.verifyIntegrity('ASO', 'build-003');
    expect(verification.valid).toBe(false);
    expect(verification.errors.length).toBeGreaterThan(0);
    expect(verification.errors.some(e => e.toLowerCase().includes('hash mismatch'))).toBe(true);
  });

  it('should list builds', () => {
    const content = Buffer.from('test');
    vault.writeArtifact('PROJ-A', 'build-001', 'file.txt', content);
    vault.writeArtifact('PROJ-A', 'build-002', 'file.txt', content);
    vault.writeArtifact('PROJ-B', 'build-003', 'file.txt', content);

    const manifest1 = {
      buildId: 'build-001',
      project: 'PROJ-A',
      intentId: 'int-1',
      createdAt: new Date().toISOString(),
      files: {},
      chainHash: 'hash1'
    };
    const manifest2 = {
      buildId: 'build-002',
      project: 'PROJ-A',
      intentId: 'int-2',
      createdAt: new Date().toISOString(),
      files: {},
      chainHash: 'hash2'
    };
    const manifest3 = {
      buildId: 'build-003',
      project: 'PROJ-B',
      intentId: 'int-3',
      createdAt: new Date().toISOString(),
      files: {},
      chainHash: 'hash3'
    };

    vault.writeManifest(manifest1);
    vault.writeManifest(manifest2);
    vault.writeManifest(manifest3);

    const allBuilds = vault.listBuilds();
    expect(allBuilds).toHaveLength(3);

    const projABuilds = vault.listBuilds('PROJ-A');
    expect(projABuilds).toHaveLength(2);
    expect(projABuilds.every(b => b.project === 'PROJ-A')).toBe(true);
  });
});
