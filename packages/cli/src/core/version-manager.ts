/**
 * Version Manager
 *
 * Handles version checking, enforcement, and auto-updates.
 * Fetches remote version policy and enforces lockdown rules.
 *
 * Based on thalamus-orchestrator patterns for governance enforcement
 */

import chalk from "chalk";
import { SOPHIA_VERSION } from "@sophia-code/shared";

export interface RemoteVersionConfig {
  /** Latest published version */
  latestVersion: string;
  /** Minimum allowed version (versions below this are blocked) */
  minimumVersion: string;
  /** Number of versions behind before warning */
  warningThreshold: number;
  /** Number of versions behind before lockdown */
  lockdownThreshold: number;
  /** Whether to enforce lockdown */
  enforcementEnabled: boolean;
  /** Critical security versions that must be updated immediately */
  criticalVersions: string[];
  /** Update message to show users */
  updateMessage?: string;
  /** URL to changelog */
  changelogUrl?: string;
}

interface VersionInfo {
  local: string;
  latest: string;
  minimum: string;
  versionsBehind: number;
  isLocked: boolean;
  isWarning: boolean;
  isCritical: boolean;
  message?: string;
}

const REMOTE_CONFIG_URL =
  "https://raw.githubusercontent.com/TheMethodArq/sophia-community/main/.sophia/version-policy.json";

const FALLBACK_CONFIG: RemoteVersionConfig = {
  latestVersion: SOPHIA_VERSION,
  minimumVersion: SOPHIA_VERSION,
  warningThreshold: 1,
  lockdownThreshold: 2,
  enforcementEnabled: true,
  criticalVersions: [],
  changelogUrl:
    "https://github.com/TheMethodArq/sophia-community/releases",
};

/**
 * Parse version string into comparable parts
 */
function parseVersion(version: string): number[] {
  return version
    .replace(/^v/, "")
    .split(".")
    .map((n) => parseInt(n, 10));
}

/**
 * Compare two versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const partsA = parseVersion(a);
  const partsB = parseVersion(b);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;

    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }

  return 0;
}

/**
 * Calculate versions behind
 */
function calculateVersionsBehind(local: string, latest: string): number {
  const localParts = parseVersion(local);
  const latestParts = parseVersion(latest);

  // Simple calculation: major * 100 + minor * 10 + patch differences
  const localNum = localParts[0] * 100 + (localParts[1] || 0) * 10 + (localParts[2] || 0);
  const latestNum = latestParts[0] * 100 + (latestParts[1] || 0) * 10 + (latestParts[2] || 0);

  return Math.max(0, latestNum - localNum);
}

/**
 * Fetch remote version configuration
 */
export async function fetchRemoteConfig(): Promise<RemoteVersionConfig> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(REMOTE_CONFIG_URL, {
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const config = (await response.json()) as RemoteVersionConfig;

    // Validate required fields
    if (!config.latestVersion || !config.minimumVersion) {
      throw new Error("Invalid config: missing version fields");
    }

    return config;
  } catch (error) {
    // Silently fail and use fallback - don't block users on network issues
    return {
      ...FALLBACK_CONFIG,
      latestVersion: SOPHIA_VERSION,
      minimumVersion: SOPHIA_VERSION,
    };
  }
}

/**
 * Check current version status
 */
export async function checkVersion(): Promise<VersionInfo> {
  const config = await fetchRemoteConfig();

  const versionsBehind = calculateVersionsBehind(
    SOPHIA_VERSION,
    config.latestVersion
  );

  const isBelowMinimum =
    compareVersions(SOPHIA_VERSION, config.minimumVersion) < 0;
  const isWarning =
    versionsBehind >= config.warningThreshold && !isBelowMinimum;
  const isLocked =
    config.enforcementEnabled &&
    (isBelowMinimum || versionsBehind >= config.lockdownThreshold);

  const isCritical = config.criticalVersions.some(
    (v) => compareVersions(SOPHIA_VERSION, v) <= 0
  );

  let message: string | undefined;

  if (isLocked) {
    message = `
${chalk.red("╔════════════════════════════════════════════════════════════╗")}
${chalk.red("║")}  ${chalk.bold.red("VERSION LOCKDOWN")}                                        ${chalk.red("║")}
${chalk.red("╠════════════════════════════════════════════════════════════╣")}
${chalk.red("║")}  Your version: ${chalk.yellow(SOPHIA_VERSION)}                                    ${chalk.red("║")}
${chalk.red("║")}  Required minimum: ${chalk.green(config.minimumVersion)}                          ${chalk.red("║")}
${chalk.red("║")}  Latest version: ${chalk.green(config.latestVersion)}                            ${chalk.red("║")}
${chalk.red("╠════════════════════════════════════════════════════════════╣")}
${chalk.red("║")}  ${chalk.bold("You must update to continue.")}                              ${chalk.red("║")}
${chalk.red("║")}                                                            ${chalk.red("║")}
${chalk.red("║")}  Run: ${chalk.cyan("sophia update")}                                       ${chalk.red("║")}
${chalk.red("║")}                                                            ${chalk.red("║")}
${chalk.red("║")}  ${chalk.dim(config.changelogUrl || "")}  ${chalk.red("║")}
${chalk.red("╚════════════════════════════════════════════════════════════╝")}
    `.trim();
  } else if (isCritical) {
    message = `
${chalk.red("╔════════════════════════════════════════════════════════════╗")}
${chalk.red("║")}  ${chalk.bold.red("CRITICAL SECURITY UPDATE REQUIRED")}                       ${chalk.red("║")}
${chalk.red("╠════════════════════════════════════════════════════════════╣")}
${chalk.red("║")}  Your version contains known security vulnerabilities.     ${chalk.red("║")}
${chalk.red("║")}  Update immediately: ${chalk.cyan("sophia update")}                     ${chalk.red("║")}
${chalk.red("╚════════════════════════════════════════════════════════════╝")}
    `.trim();
  } else if (isWarning) {
    message = `
${chalk.yellow("⚠")}  Version ${chalk.yellow(SOPHIA_VERSION)} is ${versionsBehind} version${versionsBehind > 1 ? "s" : ""} behind latest (${chalk.green(config.latestVersion)})

   Run ${chalk.cyan("sophia update")} to get the latest features and fixes.
   ${chalk.dim(config.changelogUrl || "")}
    `.trim();
  }

  if (config.updateMessage && (isWarning || isLocked)) {
    message += `\n\n   ${chalk.blue("ℹ")}  ${config.updateMessage}`;
  }

  return {
    local: SOPHIA_VERSION,
    latest: config.latestVersion,
    minimum: config.minimumVersion,
    versionsBehind,
    isLocked,
    isWarning,
    isCritical,
    message,
  };
}

/**
 * Enforce version check - throws if locked
 */
export async function enforceVersion(): Promise<void> {
  const info = await checkVersion();

  if (info.isLocked) {
    console.error(info.message);
    process.exit(1);
  }

  if (info.message && (info.isWarning || info.isCritical)) {
    console.warn(info.message);
    console.warn(); // Empty line for readability
  }
}

/**
 * Get the installed package manager
 */
async function detectPackageManager(): Promise<string> {
  // Check how the CLI was invoked
  const execPath = process.argv[1] || "";

  if (execPath.includes("pnpm")) return "pnpm";
  if (execPath.includes("yarn")) return "yarn";
  if (execPath.includes("bun")) return "bun";

  // Check for lockfiles in common locations
  const { execSync } = await import("node:child_process");
  const fs = await import("node:fs");

  try {
    const globalPath = execSync("npm root -g", { encoding: "utf-8" }).trim();
    if (fs.existsSync(`${globalPath}/../../pnpm-lock.yaml`))
      return "pnpm";
    if (fs.existsSync(`${globalPath}/../../yarn.lock`))
      return "yarn";
    if (fs.existsSync(`${globalPath}/../../bun.lockb`))
      return "bun";
  } catch {
    // Fallback
  }

  return "npm";
}

/**
 * Execute update command
 */
export async function performUpdate(): Promise<boolean> {
  const { execSync } = await import("node:child_process");
  const chalk = (await import("chalk")).default;

  const packageManager = await detectPackageManager();
  const packageName = "@sophia-code/cli";

  console.log(chalk.blue("📦 Updating sophia..."));
  console.log(chalk.dim(`   Using package manager: ${packageManager}`));
  console.log();

  const commands: Record<string, string> = {
    npm: `npm install -g ${packageName}@latest`,
    pnpm: `pnpm add -g ${packageName}@latest`,
    yarn: `yarn global add ${packageName}@latest`,
    bun: `bun add -g ${packageName}@latest`,
  };

  const command = commands[packageManager];

  try {
    execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log();
    console.log(chalk.green("✅ Update complete!"));
    console.log(chalk.dim(`   Run "sophia --version" to verify.`));

    return true;
  } catch (error) {
    console.error();
    console.error(chalk.red("❌ Update failed"));
    console.error();
    console.error(chalk.yellow("Try updating manually:"));
    console.error(chalk.cyan(`  ${command}`));

    return false;
  }
}

/**
 * Check if update is available (for non-blocking checks)
 */
export async function isUpdateAvailable(): Promise<boolean> {
  const info = await checkVersion();
  return info.versionsBehind > 0;
}
