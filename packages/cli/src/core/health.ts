import fs from "node:fs";
import path from "node:path";
import { SOPHIA_DIR } from "@sophia-code/shared";
import type { HealthReport, HealthCategory, Policy } from "@sophia-code/shared";
import { getDb } from "./database.js";
import { loadPolicies } from "./policy-loader.js";
import { checkFile } from "./policy-engine.js";
import { readConfig } from "./config.js";

export function calculateHealth(projectRoot: string): HealthReport {
  const categories: Record<string, HealthCategory> = {};

  // Security check
  categories["security"] = checkSecurityHealth(projectRoot);

  // Testing check
  categories["testing"] = checkTestingHealth(projectRoot);

  // Quality check
  categories["quality"] = checkQualityHealth(projectRoot);

  // Documentation check
  categories["documentation"] = checkDocHealth(projectRoot);

  // Hygiene check
  categories["hygiene"] = checkHygieneHealth(projectRoot);

  // Build config check
  categories["build-config"] = checkBuildBypassHealth(projectRoot);

  // Governance compliance check
  categories["governance"] = checkGovernanceCompliance(projectRoot);

  // Calculate overall
  const scores = Object.values(categories).map((c) => c.score);
  const overall = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length,
  );
  const grade = scoreToGrade(overall);

  const report: HealthReport = {
    project: path.basename(projectRoot),
    timestamp: new Date().toISOString(),
    overall_score: overall,
    grade,
    categories,
  };

  // Store in DB
  try {
    const db = getDb(projectRoot);
    db.prepare(
      "INSERT INTO health_scores (overall_score, grade, categories, created_at) VALUES (?, ?, ?, ?)",
    ).run(overall, grade, JSON.stringify(categories), report.timestamp);
  } catch {
    // Ignore DB errors
  }

  // Write report file
  const reportPath = path.join(projectRoot, SOPHIA_DIR, "health", "report.json");
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  return report;
}

export function getHealthHistory(
  projectRoot: string,
  limit: number = 10,
): { score: number; grade: string; date: string }[] {
  try {
    const db = getDb(projectRoot);
    return db
      .prepare(
        "SELECT overall_score as score, grade, created_at as date FROM health_scores ORDER BY created_at DESC LIMIT ?",
      )
      .all(limit) as { score: number; grade: string; date: string }[];
  } catch {
    return [];
  }
}

function checkSecurityHealth(projectRoot: string): HealthCategory {
  let score = 100;
  let issues = 0;
  let critical = 0;

  // Check for .env in git
  if (fs.existsSync(path.join(projectRoot, ".env"))) {
    const gitignore = path.join(projectRoot, ".gitignore");
    if (fs.existsSync(gitignore)) {
      const content = fs.readFileSync(gitignore, "utf-8");
      if (!content.includes(".env")) {
        score -= 20;
        critical++;
      }
    } else {
      score -= 20;
      critical++;
    }
  }

  // Check .gitignore exists
  if (!fs.existsSync(path.join(projectRoot, ".gitignore"))) {
    score -= 15;
    issues++;
  }

  return { score: Math.max(0, score), issues, critical };
}

function checkTestingHealth(projectRoot: string): HealthCategory {
  let score = 50; // Start at 50, boost for having tests

  // Look for test files
  const testPatterns = ["**/*.test.ts", "**/*.spec.ts", "**/*.test.js", "**/*.spec.js"];
  let hasTests = false;

  try {
    const { globSync } = require("glob") as typeof import("glob");
    for (const pattern of testPatterns) {
      const matches = globSync(pattern, { cwd: projectRoot, ignore: ["node_modules/**"] });
      if (matches.length > 0) {
        hasTests = true;
        score = 70 + Math.min(matches.length * 3, 30);
        break;
      }
    }
  } catch {
    // glob not available
  }

  return { score: Math.max(0, Math.min(100, score)), coverage_percent: hasTests ? undefined : 0 };
}

function checkQualityHealth(projectRoot: string): HealthCategory {
  let score = 80;

  // Check for linting config
  const lintConfigs = ["eslint.config.js", ".eslintrc.json", ".eslintrc.js", "biome.json"];
  if (!lintConfigs.some((f) => fs.existsSync(path.join(projectRoot, f)))) {
    score -= 15;
  }

  // Check for TypeScript strict mode
  const tsconfig = path.join(projectRoot, "tsconfig.json");
  if (fs.existsSync(tsconfig)) {
    try {
      const content = fs.readFileSync(tsconfig, "utf-8");
      if (!content.includes('"strict"') && !content.includes("'strict'")) {
        score -= 10;
      }
    } catch {
      // ignore
    }
  }

  return { score: Math.max(0, score), lint_errors: 0, type_errors: 0 };
}

function checkDocHealth(projectRoot: string): HealthCategory {
  let score = 50;

  if (fs.existsSync(path.join(projectRoot, "README.md"))) score += 30;
  if (fs.existsSync(path.join(projectRoot, "CONTRIBUTING.md"))) score += 10;
  if (fs.existsSync(path.join(projectRoot, "LICENSE"))) score += 10;

  return { score: Math.min(100, score) };
}

function checkHygieneHealth(projectRoot: string): HealthCategory {
  let score = 90;

  // Check for common issues
  if (fs.existsSync(path.join(projectRoot, "node_modules")) &&
      !fs.existsSync(path.join(projectRoot, ".gitignore"))) {
    score -= 20;
  }

  return { score: Math.max(0, score) };
}

function checkBuildBypassHealth(projectRoot: string): HealthCategory {
  let score = 100;
  let issues = 0;
  let critical = 0;

  const configFiles = [
    "next.config.js",
    "next.config.ts",
    "next.config.mjs",
  ];

  const bypassPatterns = [
    /ignoreDuringBuilds:\s*true/,
    /ignoreBuildErrors:\s*true/,
  ];

  for (const configFile of configFiles) {
    const fullPath = path.join(projectRoot, configFile);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const pattern of bypassPatterns) {
        if (pattern.test(content)) {
          score -= 25;
          critical++;
        }
      }
    } catch {
      // ignore
    }
  }

  return { score: Math.max(0, score), issues, critical };
}

function checkGovernanceCompliance(projectRoot: string): HealthCategory {
  let score = 100;
  let issues = 0;

  // Check if governance is initialized
  const sophiaDir = path.join(projectRoot, SOPHIA_DIR);
  if (!fs.existsSync(sophiaDir)) {
    return { score: 50, issues: 1 };
  }

  // Run policy scan on source files
  try {
    const policiesDir = path.join(projectRoot, SOPHIA_DIR, "policies");
    if (fs.existsSync(policiesDir)) {
      const policies = loadPolicies(policiesDir);
      let techStack;
      try { techStack = readConfig(projectRoot).project.tech_stack; } catch { /* ignore */ }
      const sourcePatterns = ["src/**/*.ts", "src/**/*.tsx", "app/**/*.ts", "app/**/*.tsx"];
      const { globSync } = require("glob") as typeof import("glob");

      let totalViolations = 0;
      for (const pattern of sourcePatterns) {
        const files = globSync(pattern, { cwd: projectRoot, ignore: ["node_modules/**"] });
        for (const file of files.slice(0, 50)) { // Cap at 50 files for performance
          const fullPath = path.join(projectRoot, file);
          const content = fs.readFileSync(fullPath, "utf-8");
          const results = checkFile(file, content, policies, "intermediate", techStack);
          totalViolations += results.filter((r) => r.severity === "red").length;
        }
      }

      if (totalViolations > 0) {
        score -= Math.min(totalViolations * 5, 40);
        issues += totalViolations;
      }
    }
  } catch {
    // glob or policy check not available
  }

  return { score: Math.max(0, score), issues };
}

function scoreToGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}
