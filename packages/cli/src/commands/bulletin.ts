import { Command } from "commander";
import chalk from "chalk";
import { configExists } from "../core/config.js";
import { postBulletin, getRecentBulletin } from "../core/bulletin.js";
import { relativeTime } from "../utils/format.js";

export const bulletinCommand = new Command("bulletin")
  .description("View cross-session communication")
  .option("--limit <n>", "Number of entries", "10")
  .action((options: { limit: string }) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const limit = parseInt(options.limit, 10);
    const entries = getRecentBulletin(projectRoot, limit);

    if (entries.length === 0) {
      console.log(chalk.dim("No bulletin entries."));
      return;
    }

    console.log();
    console.log(chalk.bold("Recent activity:"));
    for (const entry of entries) {
      const time = relativeTime(entry.created_at);
      const agent = entry.agent ? chalk.cyan(entry.agent) : "";
      console.log(`  ${chalk.dim(time)}  ${agent}  ${entry.message}`);
      if (entry.warning) {
        console.log(chalk.yellow(`    ${entry.warning}`));
      }
    }
    console.log();
  });

bulletinCommand
  .command("post <message>")
  .description("Post a manual bulletin entry")
  .action((message: string) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    postBulletin(projectRoot, {
      type: "manual",
      message,
    });

    console.log(chalk.green("Posted to bulletin."));
  });

function ensureInit(projectRoot: string): void {
  if (!configExists(projectRoot)) {
    console.log(chalk.red("sophia: error: .sophia/ directory not found"));
    console.log('  Run "sophia init" to set up Sophia in this project.');
    process.exit(1);
  }
}
