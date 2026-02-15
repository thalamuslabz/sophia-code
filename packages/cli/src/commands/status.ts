import { Command } from "commander";
import chalk from "chalk";
import { configExists, readConfig } from "../core/config.js";

export const statusCommand = new Command("status")
  .description("Show project governance status")
  .action(() => {
    const projectRoot = process.cwd();

    if (!configExists(projectRoot)) {
      console.log(chalk.red("sophia: error: .sophia/ directory not found"));
      console.log('  Run "sophia init" to set up Sophia in this project.');
      process.exit(1);
    }

    const config = readConfig(projectRoot);

    // Header
    const agents = config.agents.detected
      .filter((a) => a.status === "active")
      .map((a) => a.name)
      .join(", ");

    console.log();
    console.log(
      `Project: ${chalk.bold(config.project.name)}  |  ` +
      `Level: ${config.user.experience_level}  |  ` +
      `Agents: ${agents || "none"}`,
    );
    console.log();

    // Tech stack
    const stack = config.project.tech_stack;
    const stackParts = [stack.language];
    if (stack.framework) stackParts.push(stack.framework);
    if (stack.orm) stackParts.push(stack.orm);
    if (stack.test_runner) stackParts.push(stack.test_runner);
    console.log(`Tech: ${stackParts.join(", ")}`);
    console.log(`Package Manager: ${stack.package_manager}`);
    console.log();

    // Policies
    const policyCount = config.policies.enabled.length;
    console.log(
      `Policies: ${policyCount} active (${config.policies.strictness} strictness)`,
    );

    // Governance
    console.log(`Governance: ${config.user.governance_level}`);
    console.log(`Teaching: ${config.teaching.enabled ? "enabled" : "disabled"}`);
    console.log();
  });
