import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { AGENT_SIGNATURES } from "@sophia-code/shared";
import { configExists } from "../core/config.js";
import { detectAgents, createAgentFiles } from "../core/agent-detector.js";
import { syncAgent, buildSophiaContext } from "../core/adapter-engine.js";
import { loadSophiaIgnore, isAgentIgnored } from "../core/sophiaignore.js";
import { needsContentUpdate, updateContent } from "../core/content-manager.js";

export const syncCommand = new Command("sync")
  .description("Sync governance blocks into agent config files")
  .option("--dry-run", "Show what would change without writing")
  .option("--force", "Skip conflict detection")
  .option("--agent <name>", "Sync only one agent")
  .option("--create", "Create missing agent config files before syncing")
  .action((options: { dryRun?: boolean; force?: boolean; agent?: string; create?: boolean }) => {
    const projectRoot = process.cwd();

    if (!configExists(projectRoot)) {
      console.log(chalk.red("sophia: error: .sophia/ directory not found"));
      console.log('  Run "sophia init" to set up Sophia in this project.');
      process.exit(1);
    }

    // Auto-update content if package version is newer than installed version
    if (needsContentUpdate(projectRoot)) {
      const updateSpinner = ora("Updating .sophia/ content...").start();
      const result = updateContent(projectRoot);
      updateSpinner.succeed(
        `Updated .sophia/ content (${result.fromVersion} → ${result.toVersion})`,
      );
    }

    const context = buildSophiaContext(projectRoot);
    const ignoreList = loadSophiaIgnore(projectRoot);
    let agents = detectAgents(projectRoot).filter(
      (a) => !isAgentIgnored(a.name, ignoreList),
    );

    if (options.agent) {
      // If targeting a specific agent that doesn't exist, create it
      const existing = agents.filter((a) => a.name === options.agent);
      if (existing.length === 0) {
        const validAgent = AGENT_SIGNATURES.find((s) => s.name === options.agent);
        if (validAgent) {
          console.log(chalk.cyan(`Creating ${validAgent.displayName} config file...`));
          const created = createAgentFiles(projectRoot, [options.agent]);
          agents = [...agents, ...created];
        } else {
          console.log(chalk.yellow(`Unknown agent "${options.agent}". Valid: ${AGENT_SIGNATURES.map((s) => s.name).join(", ")}`));
          return;
        }
      }
      agents = agents.filter((a) => a.name === options.agent);
    }

    // If no agents found, offer to create them
    if (agents.length === 0) {
      if (options.create) {
        console.log(chalk.cyan("Creating agent config files..."));
        const created = createAgentFiles(projectRoot);
        agents = created;
        if (created.length > 0) {
          console.log(chalk.green(`Created: ${created.map((a) => a.displayName).join(", ")}`));
        }
      } else {
        console.log(chalk.dim("No agent config files found. Nothing to sync."));
        console.log(`  Run ${chalk.cyan("sophia sync --create")} to create agent config files.`);
        console.log(`  Or create them manually: ${chalk.cyan("CLAUDE.md")}, ${chalk.cyan("AGENTS.md")}, etc.`);
        return;
      }
    }

    for (const agent of agents) {
      const spinner = ora(
        `${options.dryRun ? "[DRY RUN] " : ""}Syncing ${agent.displayName}...`,
      ).start();

      const result = syncAgent(projectRoot, agent, context, {
        dryRun: options.dryRun,
        force: options.force,
      });

      if (result.success) {
        spinner.succeed(
          `${options.dryRun ? "[DRY RUN] " : ""}${agent.displayName} → ${result.filePath}`,
        );

        if (options.dryRun && result.blockInjected) {
          console.log(chalk.dim("  Block preview:"));
          const lines = result.blockInjected.split("\n").slice(0, 5);
          for (const line of lines) {
            console.log(chalk.dim(`    ${line}`));
          }
          if (result.blockInjected.split("\n").length > 5) {
            console.log(chalk.dim("    ..."));
          }
        }

        if (result.rulesDeduped.length > 0) {
          console.log(
            chalk.dim(`  Deduped: ${result.rulesDeduped.join(", ")}`),
          );
        }
      } else {
        spinner.fail(`Failed to sync ${agent.displayName}`);
      }
    }
  });
