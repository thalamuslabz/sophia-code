/**
 * Auto-Claude Integration Command
 * 
 * Manages the Open WebUI ↔ Auto-Claude integration
 * Usage: sophia auto-claude [setup|start|stop|status|logs]
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  isAutoClaudeInstalled,
  isProductivityHubSetup,
  getServiceStatus,
  installBridgeService,
  stopBridgeService,
  installOpenWebUIFunction,
  installN8NWorkflow,
  ensureAutoClaudeDirectories,
  initializeAutoClaudeIntegration,
  getAutoClaudeConfig,
} from "../core/auto-claude-integration.js";

export const autoClaudeCommand = new Command("auto-claude")
  .description("Manage Auto-Claude integration")
  .addCommand(
    new Command("setup")
      .description("Set up Auto-Claude integration")
      .option("--no-service", "Don't install background service")
      .option("--openwebui", "Install Open WebUI function only")
      .option("--n8n", "Install n8n workflow only")
      .action(async (options) => {
        const projectRoot = process.cwd();
        
        console.log(chalk.cyan.bold("\nAuto-Claude Integration Setup\n"));

        // Check prerequisites
        const acInstalled = isAutoClaudeInstalled();
        const hubSetup = isProductivityHubSetup();

        if (!acInstalled) {
          console.log(chalk.yellow("⚠️  Auto-Claude not detected on this system."));
          console.log("   Install Auto-Claude from: https://github.com/AndyMik90/Auto-Claude");
          console.log("   Then run: sophia auto-claude setup\n");
        }

        if (!hubSetup) {
          console.log(chalk.yellow("⚠️  Productivity Hub not detected."));
          console.log("   Some features require the Thalamus productivity stack.");
          console.log("   Components will be installed to ~/.sophia/ instead.\n");
        }

        // Setup based on options
        if (options.openwebui) {
          const spinner = ora("Installing Open WebUI function...").start();
          installOpenWebUIFunction();
          spinner.succeed("Open WebUI function installed");
          
          console.log("\n" + chalk.cyan("Next steps:"));
          console.log("  1. Open http://localhost:3115");
          console.log("  2. Admin Settings → Functions");
          console.log("  3. Create function with auto_claude_trigger.py");
          return;
        }

        if (options.n8n) {
          const spinner = ora("Installing n8n workflow...").start();
          installN8NWorkflow();
          spinner.succeed("n8n workflow installed");
          
          console.log("\n" + chalk.cyan("Next steps:"));
          console.log("  1. Open http://localhost:3118");
          console.log("  2. Import auto-claude-router.json workflow");
          console.log("  3. Activate the workflow");
          return;
        }

        // Full setup
        const spinner = ora("Setting up Auto-Claude integration...").start();
        
        try {
          const result = await initializeAutoClaudeIntegration(projectRoot);
          
          if (result.success && result.installed) {
            spinner.succeed("Auto-Claude integration configured");
            
            console.log("\n" + chalk.green("✓ Components installed:"));
            console.log("  • Spec directory: ~/.auto-claude/specs/");
            console.log("  • Open WebUI function: ready to install");
            console.log("  • n8n workflow: ready to import");
            
            if (result.serviceRunning) {
              console.log("  • Bridge service: " + chalk.green("running"));
            } else if (options.service !== false) {
              console.log("  • Bridge service: " + chalk.yellow("installing..."));
              const started = await installBridgeService();
              if (started) {
                console.log("  • Bridge service: " + chalk.green("running"));
              } else {
                console.log("  • Bridge service: " + chalk.red("failed to start"));
              }
            }
            
            console.log("\n" + chalk.cyan("Manual steps required:"));
            console.log("  1. Open WebUI: http://localhost:3115 → Admin → Functions");
            console.log("     Copy auto_claude_trigger.py content");
            console.log("  2. n8n (optional): http://localhost:3118 → Import workflow");
            console.log("     Import auto-claude-router.json");
            
          } else {
            spinner.warn(result.message);
          }
        } catch (error) {
          spinner.fail("Setup failed: " + (error as Error).message);
        }
      })
  )
  .addCommand(
    new Command("start")
      .description("Start the Auto-Claude bridge service")
      .action(async () => {
        const status = await getServiceStatus();
        
        if ((await status).running) {
          console.log(chalk.green("✓ Bridge service already running"));
          console.log(`  PID: ${status.pid ?? 'N/A'}`);
          return;
        }

        const spinner = ora("Starting bridge service...").start();
        
        try {
          const started = await installBridgeService();
          if (started) {
            spinner.succeed("Bridge service started");
            const newStatus = await getServiceStatus();
            if (newStatus.running) {
              console.log(`  PID: ${newStatus.pid ?? 'N/A'}`);
            }
          } else {
            spinner.fail("Failed to start bridge service");
            console.log("\n" + chalk.yellow("Try manual start:"));
            console.log("  node ~/.sophia/scripts/auto-claude-bridge.js --watch");
          }
        } catch (error) {
          spinner.fail("Error: " + (error as Error).message);
        }
      })
  )
  .addCommand(
    new Command("stop")
      .description("Stop the Auto-Claude bridge service")
      .action(async () => {
        const spinner = ora("Stopping bridge service...").start();
        
        try {
          await stopBridgeService();
          spinner.succeed("Bridge service stopped");
        } catch (error) {
          spinner.fail("Error: " + (error as Error).message);
        }
      })
  )
  .addCommand(
    new Command("status")
      .description("Check Auto-Claude integration status")
      .action(async () => {
        console.log(chalk.cyan.bold("\nAuto-Claude Integration Status\n"));
        
        const acInstalled = isAutoClaudeInstalled();
        const hubSetup = isProductivityHubSetup();
        const serviceStatus = await getServiceStatus();
        
        // Check components
        console.log("Prerequisites:");
        console.log(`  Auto-Claude installed: ${acInstalled ? chalk.green("✓") : chalk.red("✗")}`);
        console.log(`  Productivity Hub: ${hubSetup ? chalk.green("✓") : chalk.yellow("○")}`);
        
        console.log("\nService Status:");
        if (serviceStatus.running) {
          console.log(`  Bridge: ${chalk.green("running")}`);
          console.log(`  PID: ${serviceStatus.pid ?? 'N/A'}`);
        } else {
          console.log(`  Bridge: ${chalk.red("stopped")}`);
        }
        
        // Check directories
        const specDir = path.join(os.homedir(), ".auto-claude", "specs");
        console.log("\nDirectories:");
        console.log(`  Specs: ${fs.existsSync(specDir) ? chalk.green("✓") : chalk.red("✗")} ${specDir}`);
        
        // Check for pending specs
        if (fs.existsSync(specDir)) {
          const specs = fs.readdirSync(specDir).filter(f => f.endsWith(".json"));
          if (specs.length > 0) {
            console.log(`\n  Pending specs: ${chalk.yellow(specs.length)}`);
            specs.forEach(s => console.log(`    • ${s}`));
          }
        }
        
        // Check config
        const projectRoot = process.cwd();
        const config = getAutoClaudeConfig(projectRoot);
        console.log("\nConfiguration:");
        console.log(`  Enabled: ${config.enabled ? chalk.green("yes") : chalk.red("no")}`);
        console.log(`  Trigger method: ${config.triggerMethod}`);
        console.log(`  Use n8n: ${config.useN8n ? "yes" : "no"}`);
        
        console.log("");
      })
  )
  .addCommand(
    new Command("logs")
      .description("View bridge service logs")
      .option("-f, --follow", "Follow log output")
      .option("-n, --lines <number>", "Number of lines to show", "50")
      .action((options) => {
        const logPath = path.join(os.homedir(), ".auto-claude", "logs", "bridge.log");
        
        if (!fs.existsSync(logPath)) {
          console.log(chalk.yellow("No log file found."));
          console.log(`Expected: ${logPath}`);
          return;
        }
        
        try {
          if (options.follow) {
            console.log(chalk.cyan(`Following logs: ${logPath}\n`));
            const tail = require("node:child_process").spawn("tail", ["-f", "-n", options.lines, logPath], {
              stdio: "inherit",
            });
            process.on("SIGINT", () => {
              tail.kill();
              process.exit(0);
            });
          } else {
            const output = execSync(`tail -n ${options.lines} "${logPath}"`, { encoding: "utf8" });
            console.log(chalk.cyan(`Last ${options.lines} lines of bridge.log:\n`));
            console.log(output);
          }
        } catch (error) {
          console.error("Error reading logs:", error);
        }
      })
  )
  .addCommand(
    new Command("trigger")
      .description("Manually trigger a build from a spec file")
      .argument("<spec-file>", "Path to spec JSON file")
      .action(async (specFile) => {
        if (!fs.existsSync(specFile)) {
          console.log(chalk.red(`Spec file not found: ${specFile}`));
          return;
        }
        
        const spinner = ora("Triggering build...").start();
        
        try {
          const specContent = fs.readFileSync(specFile, "utf8");
          const spec = JSON.parse(specContent);
          
          // Copy to specs directory
          const specDir = path.join(os.homedir(), ".auto-claude", "specs");
          ensureAutoClaudeDirectories();
          
          const targetPath = path.join(specDir, path.basename(specFile));
          fs.copyFileSync(specFile, targetPath);
          
          spinner.succeed(`Spec queued: ${spec.id || path.basename(specFile)}`);
          console.log(`  Bridge will process it automatically.`);
          console.log(`  Run 'sophia auto-claude logs -f' to watch progress.`);
        } catch (error) {
          spinner.fail("Error: " + (error as Error).message);
        }
      })
  );
