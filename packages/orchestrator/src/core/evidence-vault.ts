import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { BuildManifest, ArtifactInfo, EvidenceEntry } from '../types/evidence.js';

export class EvidenceVault {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.ensureBaseDirectory();
  }

  private ensureBaseDirectory(): void {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  createBuildDirectory(project: string, buildId: string): string {
    const buildPath = path.join(this.basePath, project, buildId);
    if (!fs.existsSync(buildPath)) {
      fs.mkdirSync(buildPath, { recursive: true });
    }
    return buildPath;
  }

  writeArtifact(project: string, buildId: string, filename: string, content: Buffer): ArtifactInfo {
    const buildPath = this.createBuildDirectory(project, buildId);
    const filePath = path.join(buildPath, filename);

    fs.writeFileSync(filePath, content);

    const hash = this.computeHash(content);

    return {
      hash,
      size: content.length,
      path: path.relative(this.basePath, filePath)
    };
  }

  writeManifest(manifest: BuildManifest): string;
  writeManifest(project: string, buildId: string, manifest: BuildManifest): string;
  writeManifest(
    projectOrManifest: string | BuildManifest,
    buildId?: string,
    manifest?: BuildManifest
  ): string {
    let finalManifest: BuildManifest;
    let finalProject: string;
    let finalBuildId: string;

    if (typeof projectOrManifest === 'string' && buildId && manifest) {
      // E2E style: (project, buildId, manifest)
      finalProject = projectOrManifest;
      finalBuildId = buildId;
      finalManifest = manifest;
    } else if (typeof projectOrManifest === 'object') {
      // Original style: (manifest)
      finalManifest = projectOrManifest;
      finalProject = finalManifest.project;
      finalBuildId = finalManifest.buildId;
    } else {
      throw new Error('Invalid arguments to writeManifest');
    }

    const buildPath = path.join(this.basePath, finalProject, finalBuildId);
    const manifestPath = path.join(buildPath, 'manifest.json');

    fs.writeFileSync(manifestPath, JSON.stringify(finalManifest, null, 2));

    return manifestPath;
  }

  readManifest(project: string, buildId: string): BuildManifest | null {
    const manifestPath = path.join(this.basePath, project, buildId, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content) as BuildManifest;
  }

  verifyIntegrity(project: string, buildId: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const manifest = this.readManifest(project, buildId);

    if (!manifest) {
      return { valid: false, errors: [`Manifest not found for ${project}/${buildId}`] };
    }

    const buildPath = path.join(this.basePath, project, buildId);

    for (const [filename, artifactInfo] of Object.entries(manifest.files)) {
      const filePath = path.join(buildPath, filename);

      if (!fs.existsSync(filePath)) {
        errors.push(`Missing file: ${filename}`);
        continue;
      }

      const content = fs.readFileSync(filePath);

      if (content.length !== artifactInfo.size) {
        errors.push(`Size mismatch for ${filename}: expected ${artifactInfo.size}, got ${content.length}`);
      }

      const actualHash = this.computeHash(content);
      if (actualHash !== artifactInfo.hash) {
        errors.push(`Hash mismatch for ${filename}: expected ${artifactInfo.hash}, got ${actualHash}`);
      }
    }

    const chainHash = this.computeChainHash(manifest);
    if (chainHash !== manifest.chainHash) {
      errors.push(`Chain hash mismatch: expected ${manifest.chainHash}, computed ${chainHash}`);
    }

    return { valid: errors.length === 0, errors };
  }

  listBuilds(project?: string): EvidenceEntry[];
  listBuilds(project: string, returnType: 'paths'): string[];
  listBuilds(project?: string, returnType?: 'paths'): EvidenceEntry[] | string[] {
    const entries: EvidenceEntry[] = [];
    const paths: string[] = [];

    const projects = project ? [project] : this.listProjects();

    for (const proj of projects) {
      const projectPath = path.join(this.basePath, proj);
      if (!fs.existsSync(projectPath)) continue;

      const buildIds = fs.readdirSync(projectPath);
      for (const buildId of buildIds) {
        const manifest = this.readManifest(proj, buildId);
        if (manifest) {
          const buildPath = path.join(projectPath, buildId);
          entries.push({
            buildId,
            project: proj,
            path: buildPath,
            manifest
          });
          paths.push(buildPath);
        }
      }
    }

    if (returnType === 'paths') {
      return paths.sort();
    }

    return entries.sort((a, b) =>
      new Date(b.manifest.createdAt).getTime() - new Date(a.manifest.createdAt).getTime()
    );
  }

  private listProjects(): string[] {
    if (!fs.existsSync(this.basePath)) return [];
    return fs.readdirSync(this.basePath).filter(name => {
      const fullPath = path.join(this.basePath, name);
      return fs.statSync(fullPath).isDirectory();
    });
  }

  private computeHash(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private computeChainHash(manifest: BuildManifest): string {
    const data = JSON.stringify({
      buildId: manifest.buildId,
      project: manifest.project,
      intentId: manifest.intentId,
      createdAt: manifest.createdAt,
      files: manifest.files
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
