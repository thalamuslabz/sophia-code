import { Command } from "commander";
import chalk from "chalk";
import { configExists } from "../core/config.js";
import {
  createClaim,
  releaseClaim,
  listActiveClaims,
  getMostRecentActiveSession,
} from "../core/session-manager.js";

export const claimCommand = new Command("claim")
  .description("Claim files/directories for a session")
  .argument("[pattern]", "File or glob pattern to claim")
  .action((pattern: string | undefined) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    if (!pattern) {
      // List claims
      const claims = listActiveClaims(projectRoot);
      if (claims.length === 0) {
        console.log(chalk.dim("No active claims."));
        return;
      }

      console.log();
      console.log(chalk.bold(`Active claims (${claims.length}):`));
      for (const c of claims) {
        console.log(`  ${c.pattern}  ${chalk.dim(c.agent)} (${c.claim_type})`);
      }
      console.log();
      return;
    }

    const session = getMostRecentActiveSession(projectRoot);
    if (!session) {
      console.log(chalk.red("No active session. Run: sophia session start --intent \"...\""));
      return;
    }

    const claim = createClaim(projectRoot, session.id, pattern);
    console.log(chalk.green(`Claimed: ${pattern} (${claim.claim_type})`));
  });

claimCommand
  .command("release [pattern]")
  .description("Release a claim")
  .action((pattern: string | undefined) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const session = getMostRecentActiveSession(projectRoot);
    if (!session) {
      console.log(chalk.dim("No active session."));
      return;
    }

    releaseClaim(projectRoot, session.id, pattern);
    console.log(chalk.green(pattern ? `Released: ${pattern}` : "All claims released."));
  });

claimCommand
  .command("list")
  .description("List all active claims")
  .action(() => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const claims = listActiveClaims(projectRoot);
    if (claims.length === 0) {
      console.log(chalk.dim("No active claims."));
      return;
    }

    console.log();
    console.log(chalk.bold(`Active claims (${claims.length}):`));
    for (const c of claims) {
      console.log(`  ${c.pattern}  ${chalk.dim(c.agent)} (${c.claim_type})`);
    }
    console.log();
  });

function ensureInit(projectRoot: string): void {
  if (!configExists(projectRoot)) {
    console.log(chalk.red("sophia: error: .sophia/ directory not found"));
    console.log('  Run "sophia init" to set up Sophia in this project.');
    process.exit(1);
  }
}
