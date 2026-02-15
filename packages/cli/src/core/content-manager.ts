import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOPHIA_DIR, SOPHIA_VERSION } from "@sophia-code/shared";
import { readConfig, writeConfig } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");

const CONTENT_MAP: Record<string, string> = {
  "policies/security.yaml": "policies/security.yaml",
  "policies/quality.yaml": "policies/quality.yaml",
  "policies/testing.yaml": "policies/testing.yaml",
  "policies/cost.yaml": "policies/cost.yaml",
  "policies/repo-hygiene.yaml": "policies/repo-hygiene.yaml",
  "agents/architect.yaml": "agents/architect.yaml",
  "agents/coding.yaml": "agents/coding.yaml",
  "agents/testing.yaml": "agents/testing.yaml",
  "agents/security.yaml": "agents/security.yaml",
  "workflows/develop.yaml": "workflows/develop.yaml",
  "workflows/quick-start.yaml": "workflows/quick-start.yaml",
  "teaching/secrets-management.md": "teaching/secrets-management.md",
  "teaching/input-validation.md": "teaching/input-validation.md",
  "teaching/error-handling.md": "teaching/error-handling.md",
  "teaching/test-driven-development.md": "teaching/test-driven-development.md",
  "teaching/multi-tenant.md": "teaching/multi-tenant.md",
  "teaching/api-security.md": "teaching/api-security.md",
  "teaching/dependency-management.md": "teaching/dependency-management.md",
  "teaching/git-hygiene.md": "teaching/git-hygiene.md",
  "adapters/registry.yaml": "adapters/registry.yaml",
  "adapters/mappings/rule-dedup.yaml": "adapters/mappings/rule-dedup.yaml",
};

export function copyDefaultContent(projectRoot: string): void {
  const sophiaDir = path.join(projectRoot, SOPHIA_DIR);

  for (const [targetRel, sourceRel] of Object.entries(CONTENT_MAP)) {
    const sourcePath = path.join(CONTENT_DIR, sourceRel);
    const targetPath = path.join(sophiaDir, targetRel);

    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

export function ensureSophiaDirs(projectRoot: string): void {
  const sophiaDir = path.join(projectRoot, SOPHIA_DIR);
  const dirs = [
    "",
    "policies",
    "agents",
    "workflows",
    "patterns",
    "adapters",
    "adapters/mappings",
    "sessions",
    "teaching",
    "health",
    "generated",
  ];

  for (const dir of dirs) {
    const fullPath = path.join(sophiaDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

export function getContentPath(relativePath: string): string {
  return path.join(CONTENT_DIR, relativePath);
}

export function needsContentUpdate(projectRoot: string): boolean {
  try {
    const config = readConfig(projectRoot);
    return config.sophia.version !== SOPHIA_VERSION;
  } catch {
    return false;
  }
}

export function getInstalledVersion(projectRoot: string): string {
  try {
    return readConfig(projectRoot).sophia.version;
  } catch {
    return "unknown";
  }
}

export function updateContent(projectRoot: string): { updated: boolean; fromVersion: string; toVersion: string } {
  const fromVersion = getInstalledVersion(projectRoot);

  ensureSophiaDirs(projectRoot);
  copyDefaultContent(projectRoot);

  const config = readConfig(projectRoot);
  config.sophia.version = SOPHIA_VERSION;
  writeConfig(projectRoot, config);

  return { updated: true, fromVersion, toVersion: SOPHIA_VERSION };
}
