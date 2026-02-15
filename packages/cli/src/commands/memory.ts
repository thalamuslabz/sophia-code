import { Command } from "commander";
import chalk from "chalk";
import { configExists } from "../core/config.js";
import {
  recordCorrection,
  recordPattern,
  findCorrections,
  findPatterns,
  getMemoryStats,
} from "../core/memory.js";

export const memoryCommand = new Command("memory")
  .description("Manage project memory (corrections and patterns)");

memoryCommand
  .command("check")
  .description("Find relevant corrections and patterns")
  .requiredOption("--keywords <keywords>", "Comma-separated keywords")
  .option("--limit <n>", "Max results", "5")
  .action((options: { keywords: string; limit: string }) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const keywords = options.keywords.split(",").map((k) => k.trim());
    const limit = parseInt(options.limit, 10);

    const corrections = findCorrections(projectRoot, { keywords, limit });
    const patterns = findPatterns(projectRoot, { keywords, limit });

    if (corrections.length === 0 && patterns.length === 0) {
      console.log(chalk.dim("No relevant memories found."));
      return;
    }

    if (corrections.length > 0) {
      console.log();
      console.log(chalk.bold("Corrections (past mistakes):"));
      for (const c of corrections) {
        const sev = c.severity === "high" ? chalk.red("HIGH") :
          c.severity === "medium" ? chalk.yellow("MED") : chalk.dim("LOW");
        console.log(`  ${sev} ${c.pattern}`);
        console.log(chalk.dim(`    Reason: ${c.reason}`));
        console.log(chalk.cyan(`    Fix: ${c.correction}`));
      }
    }

    if (patterns.length > 0) {
      console.log();
      console.log(chalk.bold("Patterns (what worked):"));
      for (const p of patterns) {
        console.log(`  ${p.description}`);
        console.log(chalk.cyan(`    Implementation: ${p.implementation}`));
      }
    }
    console.log();
  });

memoryCommand
  .command("correct")
  .description("Record a correction (mistake to avoid)")
  .requiredOption("--pattern <pattern>", "What went wrong")
  .requiredOption("--reason <reason>", "Why it was wrong")
  .requiredOption("--fix <fix>", "How to fix it")
  .requiredOption("--keywords <keywords>", "Comma-separated keywords")
  .option("--severity <severity>", "low, medium, or high", "medium")
  .action((options: {
    pattern: string;
    reason: string;
    fix: string;
    keywords: string;
    severity: string;
  }) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const id = recordCorrection(projectRoot, {
      pattern: options.pattern,
      reason: options.reason,
      correction: options.fix,
      keywords: options.keywords.split(",").map((k) => k.trim()),
      severity: options.severity as "low" | "medium" | "high",
    });

    console.log(chalk.green(`Correction recorded (id: ${id})`));
  });

memoryCommand
  .command("pattern")
  .description("Record a successful pattern")
  .requiredOption("--desc <description>", "What the pattern is")
  .requiredOption("--impl <implementation>", "How to implement it")
  .requiredOption("--keywords <keywords>", "Comma-separated keywords")
  .option("--effectiveness <level>", "low, medium, or high", "medium")
  .action((options: {
    desc: string;
    impl: string;
    keywords: string;
    effectiveness: string;
  }) => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const id = recordPattern(projectRoot, {
      description: options.desc,
      implementation: options.impl,
      keywords: options.keywords.split(",").map((k) => k.trim()),
      effectiveness: options.effectiveness as "low" | "medium" | "high",
    });

    console.log(chalk.green(`Pattern recorded (id: ${id})`));
  });

memoryCommand
  .command("stats")
  .description("Show memory statistics")
  .action(() => {
    const projectRoot = process.cwd();
    ensureInit(projectRoot);

    const stats = getMemoryStats(projectRoot);

    console.log();
    console.log(chalk.bold("Memory Statistics:"));
    console.log(`  Corrections: ${stats.totalCorrections}`);
    console.log(`  Patterns: ${stats.totalPatterns}`);
    console.log(`  Decisions: ${stats.totalDecisions}`);

    if (stats.mostCommonMistakes.length > 0) {
      console.log();
      console.log(chalk.bold("Most referenced corrections:"));
      for (const m of stats.mostCommonMistakes) {
        console.log(`  (${m.count}x) ${m.pattern}`);
      }
    }

    if (stats.mostUsedPatterns.length > 0) {
      console.log();
      console.log(chalk.bold("Most used patterns:"));
      for (const p of stats.mostUsedPatterns) {
        console.log(`  (${p.count}x) ${p.description}`);
      }
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
