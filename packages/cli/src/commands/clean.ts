import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import { configExists } from "../core/config.js";

interface Finding {
  category: string;
  file: string;
  line?: number;
  message: string;
  fixable: boolean;
}

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".sophia",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  ".cache",
  "vendor",
]);

const DEBUG_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bconsole\.log\b/, label: "console.log statement" },
  { pattern: /\bdebugger\b/, label: "debugger statement" },
  { pattern: /\/\/\s*TODO(?!\s*\(.+\))(?:\s|$)/i, label: "TODO without context (use TODO(name): description)" },
  { pattern: /\/\/\s*FIXME(?!\s*\(.+\))(?:\s|$)/i, label: "FIXME without context (use FIXME(name): description)" },
];

const GIT_HYGIENE_FILES = [
  ".env",
  ".env.local",
  ".env.production",
  ".DS_Store",
  "Thumbs.db",
  ".idea",
  ".vscode/settings.json",
];

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".vue",
  ".svelte",
]);

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export const cleanCommand = new Command("clean")
  .description("Scan project for debug artifacts, large files, and hygiene issues")
  .option("--fix", "Auto-fix simple issues (e.g., add entries to .gitignore)")
  .action((options: { fix?: boolean }) => {
    const projectRoot = process.cwd();

    if (!configExists(projectRoot)) {
      console.log(chalk.red("sophia: error: .sophia/ directory not found"));
      console.log('  Run "sophia init" to set up Sophia in this project.');
      process.exit(1);
    }

    console.log();
    console.log(chalk.bold("Scanning project for issues..."));
    console.log();

    const findings: Finding[] = [];

    // 1. Debug artifacts
    scanDebugArtifacts(projectRoot, projectRoot, findings);

    // 2. Large files
    scanLargeFiles(projectRoot, projectRoot, findings);

    // 3. Git hygiene
    scanGitHygiene(projectRoot, findings);

    // Display results
    if (findings.length === 0) {
      console.log(chalk.green("  No issues found. Project is clean."));
      console.log();
      return;
    }

    const grouped = groupByCategory(findings);

    for (const [category, items] of Object.entries(grouped)) {
      const icon = categoryIcon(category);
      console.log(`${icon} ${chalk.bold(category)} ${chalk.dim(`(${items.length})`)}`);
      console.log();

      for (const item of items) {
        const loc = item.line ? `${item.file}:${item.line}` : item.file;
        const fixTag = item.fixable ? chalk.dim(" [fixable]") : "";
        console.log(`  ${chalk.dim(loc)}`);
        console.log(`    ${item.message}${fixTag}`);
      }
      console.log();
    }

    // Summary
    const totalFixable = findings.filter((f) => f.fixable).length;
    console.log(
      chalk.bold(`  Total: ${findings.length} issue${findings.length === 1 ? "" : "s"}`) +
      (totalFixable > 0 ? chalk.dim(` (${totalFixable} auto-fixable with --fix)`) : ""),
    );
    console.log();

    // Auto-fix
    if (options.fix) {
      const fixed = applyFixes(projectRoot, findings);
      if (fixed > 0) {
        console.log(chalk.green(`  Fixed ${fixed} issue${fixed === 1 ? "" : "s"}.`));
        console.log();
      }
    }
  });

function walkFiles(dir: string, rootDir: string, callback: (filePath: string, stat: fs.Stats) => void): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkFiles(fullPath, rootDir, callback);
    } else if (entry.isFile()) {
      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }
      callback(fullPath, stat);
    }
  }
}

function scanDebugArtifacts(dir: string, rootDir: string, findings: Finding[]): void {
  walkFiles(dir, rootDir, (filePath, _stat) => {
    const ext = path.extname(filePath);
    if (!SOURCE_EXTENSIONS.has(ext)) return;

    // Skip files larger than 500KB for content scanning
    const size = _stat.size;
    if (size > 500 * 1024) return;

    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      return;
    }

    const relativePath = path.relative(rootDir, filePath);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;

      for (const { pattern, label } of DEBUG_PATTERNS) {
        if (pattern.test(line)) {
          findings.push({
            category: "Debug Artifacts",
            file: relativePath,
            line: i + 1,
            message: label,
            fixable: false,
          });
        }
      }
    }
  });
}

function scanLargeFiles(dir: string, rootDir: string, findings: Finding[]): void {
  walkFiles(dir, rootDir, (filePath, stat) => {
    if (stat.size > MAX_FILE_SIZE) {
      const relativePath = path.relative(rootDir, filePath);
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
      findings.push({
        category: "Large Files",
        file: relativePath,
        message: `${sizeMB}MB — consider adding to .gitignore or using Git LFS`,
        fixable: false,
      });
    }
  });
}

function scanGitHygiene(projectRoot: string, findings: Finding[]): void {
  // Read existing .gitignore
  const gitignorePath = path.join(projectRoot, ".gitignore");
  let gitignoreContent = "";
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
  }

  const gitignoreLines = new Set(
    gitignoreContent
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#")),
  );

  for (const pattern of GIT_HYGIENE_FILES) {
    const fullPath = path.join(projectRoot, pattern);
    const exists = fs.existsSync(fullPath);

    if (exists && !isIgnoredByGitignore(pattern, gitignoreLines)) {
      findings.push({
        category: "Git Hygiene",
        file: pattern,
        message: `${pattern} exists but is not in .gitignore`,
        fixable: true,
      });
    }
  }

  // Check if node_modules is committed (tracked by git)
  const nodeModulesPath = path.join(projectRoot, "node_modules");
  if (fs.existsSync(nodeModulesPath) && !isIgnoredByGitignore("node_modules", gitignoreLines)) {
    findings.push({
      category: "Git Hygiene",
      file: "node_modules/",
      message: "node_modules exists but is not in .gitignore",
      fixable: true,
    });
  }
}

function isIgnoredByGitignore(filePath: string, gitignoreLines: Set<string>): boolean {
  // Simple check: see if the file or a parent directory pattern is in .gitignore
  if (gitignoreLines.has(filePath)) return true;
  if (gitignoreLines.has(`/${filePath}`)) return true;
  if (gitignoreLines.has(`${filePath}/`)) return true;

  // Check directory patterns (e.g., ".env*" or "node_modules/")
  const baseName = path.basename(filePath);
  for (const line of gitignoreLines) {
    if (line === baseName) return true;
    if (line === `${baseName}/`) return true;
    // Simple glob: .env* matches .env.local
    if (line.endsWith("*") && baseName.startsWith(line.slice(0, -1))) return true;
  }

  return false;
}

function groupByCategory(findings: Finding[]): Record<string, Finding[]> {
  const groups: Record<string, Finding[]> = {};
  for (const finding of findings) {
    const list = groups[finding.category];
    if (list) {
      list.push(finding);
    } else {
      groups[finding.category] = [finding];
    }
  }
  return groups;
}

function categoryIcon(category: string): string {
  switch (category) {
    case "Debug Artifacts":
      return chalk.yellow("DBG");
    case "Large Files":
      return chalk.red("LRG");
    case "Git Hygiene":
      return chalk.magenta("GIT");
    default:
      return chalk.dim("---");
  }
}

function applyFixes(projectRoot: string, findings: Finding[]): number {
  let fixed = 0;
  const gitignorePath = path.join(projectRoot, ".gitignore");

  const gitHygieneFindings = findings.filter(
    (f) => f.category === "Git Hygiene" && f.fixable,
  );

  if (gitHygieneFindings.length === 0) return fixed;

  let gitignoreContent = "";
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
  }

  const linesToAdd: string[] = [];
  for (const finding of gitHygieneFindings) {
    const entry = finding.file.replace(/\/$/, "");
    linesToAdd.push(entry);
    fixed++;
  }

  if (linesToAdd.length > 0) {
    const separator = gitignoreContent.length > 0 && !gitignoreContent.endsWith("\n") ? "\n" : "";
    const header = "\n# Added by sophia clean --fix\n";
    const newEntries = linesToAdd.join("\n") + "\n";
    fs.writeFileSync(gitignorePath, gitignoreContent + separator + header + newEntries, "utf-8");
    console.log(chalk.dim(`  Updated .gitignore with ${linesToAdd.length} entries`));
  }

  return fixed;
}
