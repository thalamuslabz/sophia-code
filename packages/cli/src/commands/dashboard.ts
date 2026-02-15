import { Command } from "commander";
import chalk from "chalk";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configExists } from "../core/config.js";

const DASHBOARD_PORT = 9473;

export const dashboardCommand = new Command("dashboard")
  .description("Start the Sophia governance dashboard")
  .option("-p, --port <port>", "Port to run the dashboard on", String(DASHBOARD_PORT))
  .action((options: { port?: string }) => {
    const projectRoot = process.cwd();

    if (!configExists(projectRoot)) {
      console.log(chalk.red("sophia: error: .sophia/ directory not found"));
      console.log('  Run "sophia init" to set up Sophia in this project.');
      process.exit(1);
    }

    const port = options.port ?? String(DASHBOARD_PORT);

    // Resolve the dashboard package directory relative to the CLI package
    const currentFile = fileURLToPath(import.meta.url);
    const cliPackageRoot = path.resolve(path.dirname(currentFile), "..", "..");
    const dashboardDir = path.resolve(cliPackageRoot, "..", "dashboard");

    console.log();
    console.log(chalk.bold("Starting Sophia Dashboard..."));
    console.log();
    console.log(`  ${chalk.dim("URL:")}       http://localhost:${port}`);
    console.log(`  ${chalk.dim("Project:")}   ${projectRoot}`);
    console.log(`  ${chalk.dim("Dashboard:")} ${dashboardDir}`);
    console.log();
    console.log(chalk.dim("Press Ctrl+C to stop"));
    console.log();

    const child = spawn("npx", ["next", "dev", "-p", port], {
      cwd: dashboardDir,
      stdio: "inherit",
      env: {
        ...process.env,
        SOPHIA_PROJECT_ROOT: projectRoot,
      },
    });

    // Start the file watcher alongside the dashboard
    const watcher = spawn("sophia", ["watch"], {
      cwd: projectRoot,
      stdio: "pipe",
    });

    watcher.stdout?.on("data", (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.log(chalk.dim(`[watch] ${line}`));
    });

    // Auto-open browser after a short delay
    setTimeout(() => {
      const url = `http://localhost:${port}`;
      const openCmd = process.platform === "darwin" ? "open" : "xdg-open";
      spawn(openCmd, [url], { stdio: "ignore", detached: true }).unref();
    }, 2000);

    // Handle graceful shutdown
    const cleanup = (): void => {
      console.log();
      console.log(chalk.dim("Stopping dashboard and watcher..."));
      watcher.kill("SIGTERM");
      child.kill("SIGTERM");
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    child.on("error", (err) => {
      console.log(chalk.red(`sophia: error: failed to start dashboard: ${err.message}`));
      process.exit(1);
    });

    child.on("close", (code) => {
      process.exit(code ?? 0);
    });
  });
