import { Command } from "commander";
import chalk from "chalk";
import { configExists } from "../core/config.js";
import { loadExplainContent, listTopics } from "../core/teaching-engine.js";

export const explainCommand = new Command("explain")
  .description("Learn about enterprise development concepts")
  .argument("[topic]", "Topic to explain")
  .option("--list", "List available topics")
  .action((topic: string | undefined, options: { list?: boolean }) => {
    const projectRoot = process.cwd();

    if (!configExists(projectRoot)) {
      console.log(chalk.red("sophia: error: .sophia/ directory not found"));
      console.log('  Run "sophia init" to set up Sophia in this project.');
      process.exit(1);
    }

    if (options.list || !topic) {
      const topics = listTopics(projectRoot);
      if (topics.length === 0) {
        console.log(chalk.dim("No teaching topics found."));
        return;
      }
      console.log();
      console.log(chalk.bold("Available topics:"));
      for (const t of topics) {
        console.log(`  ${chalk.cyan("sophia explain")} ${t}`);
      }
      console.log();
      return;
    }

    const content = loadExplainContent(projectRoot, topic);
    if (!content) {
      console.log(chalk.red(`Topic "${topic}" not found.`));
      console.log("Run " + chalk.cyan("sophia explain --list") + " to see available topics.");
      return;
    }

    console.log();
    console.log(content.content);

    if (content.relatedPolicies.length > 0) {
      console.log();
      console.log(chalk.dim("Related policies: " + content.relatedPolicies.join(", ")));
    }
  });
