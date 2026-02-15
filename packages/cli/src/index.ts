#!/usr/bin/env node

// Respect NO_COLOR convention (https://no-color.org/)
if (process.env["NO_COLOR"] !== undefined) {
  // chalk automatically respects NO_COLOR, but ensure consistency
  process.env["FORCE_COLOR"] = "0";
}

import { Command } from "commander";
import { SOPHIA_VERSION } from "@sophia-code/shared";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { syncCommand } from "./commands/sync.js";
import { policyCommand } from "./commands/policy.js";
import { explainCommand } from "./commands/explain.js";
import { memoryCommand } from "./commands/memory.js";
import { sessionCommand } from "./commands/session.js";
import { claimCommand } from "./commands/claim.js";
import { bulletinCommand } from "./commands/bulletin.js";
import { verifyCommand } from "./commands/verify.js";
import { cleanCommand } from "./commands/clean.js";
import { dashboardCommand } from "./commands/dashboard.js";
import { watchCommand } from "./commands/watch.js";

const program = new Command();

program
  .name("sophia")
  .description("CLI-first governance tool for AI-assisted development")
  .version(SOPHIA_VERSION, "-V, --version", "output the version number");

program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(syncCommand);
program.addCommand(policyCommand);
program.addCommand(explainCommand);
program.addCommand(memoryCommand);
program.addCommand(sessionCommand);
program.addCommand(claimCommand);
program.addCommand(bulletinCommand);
program.addCommand(verifyCommand);
program.addCommand(cleanCommand);
program.addCommand(dashboardCommand);
program.addCommand(watchCommand);

program.parse();
