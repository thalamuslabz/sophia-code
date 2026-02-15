import { Command } from "commander";
import chalk from "chalk";
import { configExists } from "../core/config.js";
import { calculateHealth, getHealthHistory } from "../core/health.js";

export const verifyCommand = new Command("verify")
  .description("Verify project health and generate grade")
  .option("--history", "Show score history")
  .option("-q, --quiet", "Minimal output (just grade and score)")
  .action((options: { history?: boolean; quiet?: boolean }) => {
    const projectRoot = process.cwd();

    if (!configExists(projectRoot)) {
      console.log(chalk.red("sophia: error: .sophia/ directory not found"));
      console.log('  Run "sophia init" to set up Sophia in this project.');
      process.exit(1);
    }

    if (options.history) {
      const history = getHealthHistory(projectRoot);
      if (history.length === 0) {
        console.log(chalk.dim("No health history. Run: sophia verify"));
        return;
      }

      console.log();
      console.log(chalk.bold("Health Score History:"));
      for (const entry of history) {
        const date = new Date(entry.date).toLocaleDateString();
        console.log(`  ${date}  ${gradeColor(entry.grade)}  ${entry.score}/100`);
      }
      console.log();
      return;
    }

    const report = calculateHealth(projectRoot);

    if (options.quiet) {
      const gradeStr = gradeColor(report.grade);
      console.log(`Sophia Health: ${gradeStr} (${report.overall_score}/100)`);
      return;
    }

    console.log();
    console.log(chalk.bold("Running health checks..."));
    console.log();

    // Display grade
    const gradeStr = gradeColor(report.grade);
    console.log(`  Health Grade: ${gradeStr}  (${report.overall_score}/100)`);
    console.log();

    // Category breakdown
    console.log(chalk.bold("  Categories:"));
    for (const [name, cat] of Object.entries(report.categories)) {
      const bar = progressBar(cat.score, 20);
      const catGrade = gradeColor(scoreToLetterGrade(cat.score));
      console.log(`    ${name.padEnd(15)} ${bar} ${cat.score}/100 ${catGrade}`);
    }
    console.log();

    // Actionable items
    const actions = getActionableItems(report);
    if (actions.length > 0) {
      console.log(chalk.bold("  Top actions to improve:"));
      for (const action of actions.slice(0, 3)) {
        console.log(`    ${chalk.yellow(">")} ${action}`);
      }
      console.log();
    }
  });

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return chalk.green.bold(grade);
  if (grade.startsWith("B")) return chalk.blue.bold(grade);
  if (grade.startsWith("C")) return chalk.yellow.bold(grade);
  return chalk.red.bold(grade);
}

function progressBar(score: number, width: number): string {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return chalk.green("█".repeat(filled)) + chalk.dim("░".repeat(empty));
}

function scoreToLetterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function getActionableItems(report: import("@sophia-code/shared").HealthReport): string[] {
  const items: string[] = [];
  const categories = report.categories;

  // Sort by lowest score
  const sorted = Object.entries(categories).sort(([, a], [, b]) => a.score - b.score);

  for (const [name, cat] of sorted) {
    if (cat.score < 70) {
      items.push(`Improve ${name} (currently ${cat.score}/100)`);
    }
  }

  return items;
}
