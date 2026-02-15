import { Command } from "commander";
import chalk from "chalk";
import { configExists } from "../core/config.js";
import {
  registerSession,
  endSession,
  listActiveSessions,
  cleanupStaleSessions,
  checkFile,
  getMostRecentActiveSession,
} from "../core/session-manager.js";
import { postBulletin } from "../core/bulletin.js";
import { relativeTime } from "../utils/format.js";

export const sessionCommand = new Command("session")
  .description("Manage coding sessions");

sessionCommand
  .command("start")
  .description("Register a new coding session")
  .option("--intent <description>", "What you're working on")
  .option("--agent <name>", "Agent name", "manual")
  .action((options: { intent?: string; agent: string }) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);
    cleanupStaleSessions(projectRoot);

    const session = registerSession(projectRoot, {
      agent: options.agent,
      pid: process.pid,
      intent: options.intent,
    });

    postBulletin(projectRoot, {
      sessionId: session.id,
      agent: options.agent,
      type: "session_start",
      message: `Session started: ${options.intent ?? "no intent specified"}`,
    });

    console.log(chalk.green(`Session started: ${session.id}`));
    if (options.intent) {
      console.log(chalk.dim(`  Intent: ${options.intent}`));
    }
  });

sessionCommand
  .command("end")
  .description("End the current session")
  .action(() => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const session = getMostRecentActiveSession(projectRoot);
    if (!session) {
      console.log(chalk.dim("No active session found."));
      return;
    }

    endSession(projectRoot, session.id);

    postBulletin(projectRoot, {
      sessionId: session.id,
      type: "session_end",
      message: "Session ended",
    });

    console.log(chalk.green(`Session ${session.id} ended.`));
  });

sessionCommand
  .command("list")
  .description("List active sessions")
  .action(() => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);
    cleanupStaleSessions(projectRoot);

    const sessions = listActiveSessions(projectRoot);

    if (sessions.length === 0) {
      console.log(chalk.dim("No active sessions."));
      return;
    }

    console.log();
    console.log(chalk.bold(`Active sessions (${sessions.length}):`));
    for (const s of sessions) {
      console.log(
        `  ${chalk.cyan(s.id)}  ${s.agent}  ${relativeTime(s.last_activity_at)}`,
      );
      if (s.intent) {
        console.log(chalk.dim(`    ${s.intent}`));
      }
    }
    console.log();
  });

sessionCommand
  .command("check <filepath>")
  .description("Check if a file is claimed by another session")
  .action((filepath: string) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const status = checkFile(projectRoot, filepath);

    if (status.claimed && status.claimedBy) {
      console.log(
        chalk.yellow(`Claimed by ${status.claimedBy.agent} (${status.claimedBy.sessionId})`),
      );
      if (status.claimedBy.intent) {
        console.log(chalk.dim(`  Intent: ${status.claimedBy.intent}`));
      }
      console.log(chalk.dim(`  Type: ${status.claimedBy.claimType}`));
    } else {
      console.log(chalk.green(`${filepath}: not claimed`));
    }
  });

function ensureInit(projectRoot: string): void {
  if (!configExists(projectRoot)) {
    console.log(chalk.red("sophia: error: .sophia/ directory not found"));
    console.log('  Run "sophia init" to set up Sophia in this project.');
    process.exit(1);
  }
}
