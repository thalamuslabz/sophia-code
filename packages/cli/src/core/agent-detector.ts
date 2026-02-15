import fs from "node:fs";
import path from "node:path";
import { AGENT_SIGNATURES, MARKER_START } from "@sophia-code/shared";
import type { DetectedAgent, DetectedAgentConfig } from "@sophia-code/shared";

export function detectAgents(projectRoot: string): DetectedAgent[] {
  const detected: DetectedAgent[] = [];

  for (const sig of AGENT_SIGNATURES) {
    for (const configFile of sig.configFiles) {
      const fullPath = path.join(projectRoot, configFile);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        detected.push({
          name: sig.name,
          displayName: sig.displayName,
          configFile,
          configExists: true,
          existingContent: content,
          hasSophiaBlock: content.includes(MARKER_START),
        });
        break; // only first match per agent
      }
    }
  }

  return detected;
}

/**
 * Create agent config files that don't exist yet.
 * Returns the list of newly created agents.
 */
export function createAgentFiles(
  projectRoot: string,
  agentNames?: string[],
): DetectedAgent[] {
  const created: DetectedAgent[] = [];
  const targets = agentNames
    ? AGENT_SIGNATURES.filter((s) => agentNames.includes(s.name))
    : AGENT_SIGNATURES;

  for (const sig of targets) {
    const configFile = sig.configFiles[0]!;
    const fullPath = path.join(projectRoot, configFile);

    // Skip if any config file for this agent already exists
    const alreadyExists = sig.configFiles.some((f) =>
      fs.existsSync(path.join(projectRoot, f)),
    );
    if (alreadyExists) continue;

    // Create parent directory if needed
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write minimal stub — sophia sync will inject the governance block
    const stub = `# ${sig.displayName} Configuration\n`;
    fs.writeFileSync(fullPath, stub, "utf-8");

    created.push({
      name: sig.name,
      displayName: sig.displayName,
      configFile,
      configExists: true,
      existingContent: stub,
      hasSophiaBlock: false,
    });
  }

  return created;
}

export function toAgentConfigs(agents: DetectedAgent[]): DetectedAgentConfig[] {
  return agents.map((a) => ({
    name: a.name,
    config_file: a.configFile,
    status: "active" as const,
  }));
}
