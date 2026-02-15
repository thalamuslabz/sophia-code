import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  SOPHIA_DIR,
  SOPHIA_CONFIG_FILE,
  SOPHIA_VERSION,
  DEFAULT_EXPERIENCE_LEVEL,
  DEFAULT_GOVERNANCE_LEVEL,
  DEFAULT_CLAIM_MODE,
  DEFAULT_STRICTNESS,
  GOVERNANCE_POLICY_SETS,
} from "@sophia-code/shared";
import { SophiaConfigSchema } from "@sophia-code/shared";
import type { SophiaConfig, ProjectProfile, DetectedAgentConfig, GovernanceLevel } from "@sophia-code/shared";

export function generateDefaultConfig(
  projectName: string,
  profile: ProjectProfile,
  agents: DetectedAgentConfig[],
  governanceLevel: GovernanceLevel = DEFAULT_GOVERNANCE_LEVEL,
): SophiaConfig {
  const now = new Date().toISOString();
  const enabledPolicies = GOVERNANCE_POLICY_SETS[governanceLevel] ?? GOVERNANCE_POLICY_SETS["community"]!;

  return {
    sophia: {
      version: SOPHIA_VERSION,
      initialized: now,
    },
    project: {
      name: projectName,
      tech_stack: {
        language: profile.language,
        framework: profile.framework,
        database: profile.database,
        orm: profile.orm,
        package_manager: profile.packageManager,
        test_runner: profile.testRunner,
        ui_framework: profile.uiFramework,
        styling: profile.styling,
        state_management: profile.stateManagement,
      },
      detected_at: now,
    },
    agents: {
      detected: agents,
    },
    user: {
      experience_level: DEFAULT_EXPERIENCE_LEVEL,
      governance_level: governanceLevel,
    },
    session: {
      auto_detect: true,
      stale_timeout_minutes: 30,
      claim_mode: DEFAULT_CLAIM_MODE,
    },
    policies: {
      enabled: enabledPolicies,
      strictness: DEFAULT_STRICTNESS,
    },
    teaching: {
      enabled: true,
      show_explanations: true,
      first_time_hints: true,
    },
    health: {
      auto_score: true,
      score_on_commit: false,
    },
  };
}

export function writeConfig(projectRoot: string, config: SophiaConfig): void {
  const configPath = path.join(projectRoot, SOPHIA_DIR, SOPHIA_CONFIG_FILE);
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, YAML.stringify(config), "utf-8");
}

export function readConfig(projectRoot: string): SophiaConfig {
  const configPath = path.join(projectRoot, SOPHIA_DIR, SOPHIA_CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `.sophia/config.yaml not found.\n  Run "sophia init" to set up Sophia in this project.`,
    );
  }
  const raw = YAML.parse(fs.readFileSync(configPath, "utf-8"));
  return SophiaConfigSchema.parse(raw);
}

export function configExists(projectRoot: string): boolean {
  return fs.existsSync(path.join(projectRoot, SOPHIA_DIR, SOPHIA_CONFIG_FILE));
}
