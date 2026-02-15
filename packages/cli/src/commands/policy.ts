import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import { SOPHIA_DIR } from "@sophia-code/shared";
import { STRICTNESS_SEVERITY_BLOCKS } from "@sophia-code/shared";
import { configExists, readConfig } from "../core/config.js";
import { loadPolicies } from "../core/policy-loader.js";
import { checkFile, checkGitHookRules, checkHeuristicRules, checkActionRules } from "../core/policy-engine.js";
import { generateTeaching, isFirstEncounter, markEncountered } from "../core/teaching-engine.js";
import { formatTeachingForCLI } from "../utils/format.js";

export const policyCommand = new Command("policy")
  .description("Manage and check governance policies");

policyCommand
  .command("list")
  .description("List all active policies and rules")
  .action(() => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const policiesDir = path.join(projectRoot, SOPHIA_DIR, "policies");
    const policies = loadPolicies(policiesDir);

    if (policies.length === 0) {
      console.log(chalk.dim("No policies found."));
      return;
    }

    for (const policy of policies) {
      console.log();
      console.log(chalk.bold(policy.name) + chalk.dim(` (${policy.id} v${policy.version})`));
      for (const rule of policy.rules) {
        const icon =
          rule.severity === "red" ? chalk.red("RED") :
          rule.severity === "yellow" ? chalk.yellow("YEL") :
          chalk.green("GRN");
        console.log(`  ${icon}  ${rule.id}: ${rule.name}`);
        console.log(chalk.dim(`       ${rule.description}`));
      }
    }
    console.log();
  });

policyCommand
  .command("check [file]")
  .description("Check a file or staged changes against policies")
  .option("--staged", "Check git staged files")
  .option("-q, --quiet", "Minimal output")
  .action((file: string | undefined, options: { staged?: boolean; quiet?: boolean }) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const config = readConfig(projectRoot);
    const policiesDir = path.join(projectRoot, SOPHIA_DIR, "policies");
    const policies = loadPolicies(policiesDir);
    const level = config.user.experience_level;
    const techStack = config.project.tech_stack;

    if (options.staged) {
      // Check staged files via git
      const { execSync } = require("node:child_process") as typeof import("node:child_process");
      let stagedFiles: string[];
      try {
        const output = execSync("git diff --cached --name-only", { encoding: "utf-8" });
        stagedFiles = output.trim().split("\n").filter(Boolean);
      } catch {
        console.log(chalk.dim("No staged files."));
        return;
      }

      const allResults: import("@sophia-code/shared").PolicyResult[] = [];

      // Pattern-based detection (context-aware: skips project's own UI framework)
      for (const f of stagedFiles) {
        const fullPath = path.join(projectRoot, f);
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, "utf-8");
        allResults.push(...checkFile(f, content, policies, level, techStack));
      }

      // Git-hook detection (file patterns, size thresholds, staged content patterns)
      allResults.push(...checkGitHookRules(projectRoot, policies, level));

      // Heuristic detection (new files without tests)
      allResults.push(...checkHeuristicRules(projectRoot, policies, level));

      // Action detection (duplicate deps)
      allResults.push(...checkActionRules(projectRoot, policies, level));

      // Deduplicate by ruleId+file
      const seen = new Set<string>();
      const uniqueResults = allResults.filter((r) => {
        const key = `${r.ruleId}:${r.file ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Determine blocking based on strictness
      const strictness = config.policies.strictness;
      const blockSeverities = STRICTNESS_SEVERITY_BLOCKS[strictness] ?? ["red"];

      let shouldBlock = false;
      for (const result of uniqueResults) {
        if (blockSeverities.includes(result.severity)) shouldBlock = true;
        if (!options.quiet) {
          printResult(projectRoot, result, level);
        }
      }

      if (shouldBlock) process.exit(1);
      return;
    }

    if (!file) {
      console.log(chalk.red("sophia: error: specify a file or use --staged"));
      process.exit(1);
    }

    const fullPath = path.resolve(projectRoot, file);
    if (!fs.existsSync(fullPath)) {
      console.log(chalk.red(`sophia: error: file not found: ${file}`));
      process.exit(1);
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    const results = checkFile(file, content, policies, level, techStack);

    if (results.length === 0) {
      console.log(chalk.green("No policy violations found."));
      return;
    }

    for (const result of results) {
      printResult(projectRoot, result, level);
    }

    const hasRed = results.some((r) => r.severity === "red");
    if (hasRed) process.exit(1);
  });

function printResult(
  projectRoot: string,
  result: import("@sophia-code/shared").PolicyResult,
  level: import("@sophia-code/shared").ExperienceLevel,
): void {
  const icon =
    result.severity === "red" ? chalk.red("RED") :
    result.severity === "yellow" ? chalk.yellow("YEL") :
    chalk.green("GRN");

  console.log();
  console.log(`${icon}  ${result.ruleId}: ${result.description}`);
  if (result.file && result.line) {
    console.log(chalk.dim(`  ${result.file}:${result.line}`));
  }
  if (result.match) {
    console.log(chalk.dim(`  Match: ${result.match.substring(0, 80)}`));
  }
  if (level !== "advanced" && result.teaching) {
    console.log();
    console.log(chalk.dim(result.teaching.trim()));
  }
  if (result.fixSuggestion) {
    console.log();
    console.log(chalk.cyan(`  Fix: ${result.fixSuggestion}`));
  }

  // Track encounter
  markEncountered(projectRoot, result.ruleId);
}

function ensureInit(projectRoot: string): void {
  if (!configExists(projectRoot)) {
    console.log(chalk.red("sophia: error: .sophia/ directory not found"));
    console.log('  Run "sophia init" to set up Sophia in this project.');
    process.exit(1);
  }
}
