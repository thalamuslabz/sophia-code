import fs from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { MARKER_START, MARKER_END, SOPHIA_DIR } from "@sophia-code/shared";
import type {
  DetectedAgent,
  SophiaContext,
  InjectResult,
  WorkflowDefinition,
} from "@sophia-code/shared";
import { readConfig } from "./config.js";
import { loadPolicies } from "./policy-loader.js";
import { getDedupedRuleIds } from "./dedup.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

// Register Handlebars helpers
Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

export function syncAgent(
  projectRoot: string,
  agent: DetectedAgent,
  context: SophiaContext,
  options: { dryRun?: boolean; force?: boolean } = {},
): InjectResult {
  const templateName = getTemplateName(agent.name);
  const templatePath = path.join(TEMPLATES_DIR, templateName);

  if (!fs.existsSync(templatePath)) {
    return {
      success: false,
      filePath: agent.configFile,
      blockInjected: "",
      existingContentPreserved: true,
      conflictsFound: [],
      rulesDeduped: [],
    };
  }

  const templateSource = fs.readFileSync(templatePath, "utf-8");
  const template = Handlebars.compile(templateSource, { noEscape: true });
  const block = template({
    config: context.config,
    policies: context.policies,
    agents: context.agents,
    workflows: context.workflows,
    sessionInstructions: context.sessionInstructions,
    timestamp: new Date().toISOString(),
    version: context.config.sophia.version,
    patterns: context.patterns ?? [],
  });

  const filePath = path.join(projectRoot, agent.configFile);
  const existingContent = agent.existingContent ?? "";

  // Dedup: find rules already covered by existing user content (outside sophia block)
  const userContent = extractUserContent(existingContent);
  const rulesDeduped = options.force ? [] : getDedupedRuleIds(userContent, projectRoot);
  const hasSophiaBlock = existingContent.includes(MARKER_START);

  const newContent = injectBlock(existingContent, block, hasSophiaBlock);

  if (options.dryRun) {
    return {
      success: true,
      filePath: agent.configFile,
      blockInjected: block,
      existingContentPreserved: true,
      conflictsFound: [],
      rulesDeduped,
    };
  }

  // Backup before first injection
  if (!hasSophiaBlock && existingContent.length > 0) {
    const backupPath = filePath + ".sophia-backup";
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, existingContent, "utf-8");
    }
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, newContent, "utf-8");

  // Also write preview to generated/
  const previewPath = path.join(
    projectRoot,
    SOPHIA_DIR,
    "generated",
    `${agent.name}.block`,
  );
  const previewDir = path.dirname(previewPath);
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }
  fs.writeFileSync(previewPath, `${MARKER_START}\n${block}\n${MARKER_END}`, "utf-8");

  return {
    success: true,
    filePath: agent.configFile,
    blockInjected: block,
    existingContentPreserved: true,
    conflictsFound: [],
    rulesDeduped,
  };
}

function injectBlock(
  existingContent: string,
  block: string,
  hasSophiaBlock: boolean,
): string {
  const wrappedBlock = `${MARKER_START}\n${block}\n${MARKER_END}`;

  if (hasSophiaBlock) {
    const regex = new RegExp(
      `${escapeRegex(MARKER_START)}[\\s\\S]*?${escapeRegex(MARKER_END)}`,
      "m",
    );
    return existingContent.replace(regex, wrappedBlock);
  }

  if (existingContent.trim() === "") {
    return wrappedBlock + "\n";
  }

  return `${existingContent.trimEnd()}\n\n${wrappedBlock}\n`;
}

function extractUserContent(content: string): string {
  if (!content.includes(MARKER_START)) return content;
  const regex = new RegExp(
    `${escapeRegex(MARKER_START)}[\\s\\S]*?${escapeRegex(MARKER_END)}`,
    "m",
  );
  return content.replace(regex, "").trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTemplateName(agentName: string): string {
  const map: Record<string, string> = {
    "claude-code": "claude-code.hbs",
    opencode: "opencode.hbs",
    cursor: "cursor.hbs",
    copilot: "copilot.hbs",
  };
  return map[agentName] ?? `${agentName}.hbs`;
}

export function buildSophiaContext(projectRoot: string): SophiaContext {
  const config = readConfig(projectRoot);
  const policiesDir = path.join(projectRoot, SOPHIA_DIR, "policies");
  const policies = fs.existsSync(policiesDir) ? loadPolicies(policiesDir) : [];
  const workflows = getWorkflows(projectRoot);

  return {
    config,
    policies,
    agents: [],
    workflows,
    sessionInstructions: getSessionInstructions(config.policies.strictness),
    patterns: getPatterns(projectRoot),
  };
}

function getSessionInstructions(strictness: string = "moderate"): string {
  if (strictness === "strict") {
    return `**CRITICAL: You MUST follow these session rules — commits will be BLOCKED without compliance.**

1. **Start a session IMMEDIATELY**: \`sophia session start --intent "your task description"\`
2. **Claim files before editing**: \`sophia session claim "src/path/**"\`
3. **Check before modifying unclaimed files**: \`sophia session check <filepath>\`
4. **Check bulletin every 5-10 actions**: \`sophia bulletin --since-last-check\`
5. **Before every commit, verify**: \`sophia verify\`
6. **End session when done**: \`sophia session end\`

Failure to start a session will block your commits.`;
  }

  return `**You MUST follow these session management rules:**

1. **Start a session**: Run \`sophia session start --intent "your task description"\` before beginning work.
2. **Claim your work area**: Run \`sophia session claim "src/path/**"\` to prevent conflicts.
3. **Check before modifying files outside your area**: \`sophia session check <filepath>\`
4. **Check bulletin regularly**: \`sophia bulletin --since-last-check\` (every 5-10 actions)
5. **Before every commit**: Run \`sophia verify\` to check health score.
6. **End session when done**: \`sophia session end\``;
}

function getWorkflows(projectRoot: string): WorkflowDefinition[] {
  const workflowsDir = path.join(projectRoot, SOPHIA_DIR, "workflows");
  if (!fs.existsSync(workflowsDir)) return [];

  const workflows: WorkflowDefinition[] = [];
  for (const file of fs.readdirSync(workflowsDir)) {
    if (!file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
    try {
      const content = fs.readFileSync(path.join(workflowsDir, file), "utf-8");
      const parsed = YAML.parse(content) as WorkflowDefinition;
      if (parsed?.name && parsed?.steps) {
        workflows.push(parsed);
      }
    } catch {
      // skip malformed workflow files
    }
  }
  return workflows;
}

function getPatterns(projectRoot: string): { name: string; file: string }[] {
  const patternsDir = path.join(projectRoot, SOPHIA_DIR, "patterns");
  if (!fs.existsSync(patternsDir)) return [];

  return fs
    .readdirSync(patternsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      name: f.replace(".md", "").replace(/-/g, " "),
      file: `.sophia/patterns/${f}`,
    }));
}
