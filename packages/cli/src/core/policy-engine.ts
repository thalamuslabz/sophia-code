import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { minimatch } from "minimatch";
import {
  DUPLICATE_PURPOSE_GROUPS,
  UI_FRAMEWORK_IMPORT_PREFIXES,
  STYLING_IMPORT_PREFIXES,
} from "@sophia-code/shared";
import type { Policy, PolicyRule, PolicyResult, ExperienceLevel, TechStack } from "@sophia-code/shared";

export function checkFile(
  filePath: string,
  content: string,
  policies: Policy[],
  experienceLevel: ExperienceLevel,
  techStack?: TechStack,
): PolicyResult[] {
  const results: PolicyResult[] = [];

  // Build allowlist of import prefixes belonging to project's own stack
  const ownImportPrefixes = buildOwnImportPrefixes(techStack);

  for (const policy of policies) {
    for (const rule of policy.rules) {
      // Skip non-pattern rules
      if (rule.detection.type && rule.detection.type !== "pattern") continue;
      if (!rule.detection.patterns?.length) continue;

      // File type filter
      if (rule.detection.file_types?.length) {
        const matched = rule.detection.file_types.some((pattern) =>
          minimatch(filePath, pattern, { matchBase: true }),
        );
        if (!matched) continue;
      }

      // Exclude filter
      if (rule.detection.exclude?.length) {
        const excluded = rule.detection.exclude.some((pattern) =>
          minimatch(filePath, pattern, { matchBase: true }),
        );
        if (excluded) continue;
      }

      // Run patterns
      const lines = content.split("\n");
      for (const pattern of rule.detection.patterns) {
        const regex = new RegExp(pattern, "gm");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          regex.lastIndex = 0;
          const match = regex.exec(line);
          if (match) {
            // For UI-001/UI-002: skip if the match is from the project's own framework
            if ((rule.id === "UI-001" || rule.id === "UI-002") && ownImportPrefixes.length > 0) {
              const matchStr = match[0];
              if (ownImportPrefixes.some((prefix) => matchStr.includes(prefix))) {
                continue;
              }
            }

            results.push({
              ruleId: rule.id,
              policyId: policy.id,
              severity: rule.severity,
              matched: true,
              file: filePath,
              line: i + 1,
              match: match[0],
              description: rule.description,
              teaching: getTeaching(rule, experienceLevel),
              fixSuggestion: rule.fix_suggestion,
              autoFixable: rule.auto_fixable,
            });
            break; // one match per rule per file is enough
          }
        }
      }
    }
  }

  return results;
}

function buildOwnImportPrefixes(techStack?: TechStack): string[] {
  if (!techStack) return [];
  const prefixes: string[] = [];

  if (techStack.ui_framework) {
    const uiPrefixes = UI_FRAMEWORK_IMPORT_PREFIXES[techStack.ui_framework];
    if (uiPrefixes) prefixes.push(...uiPrefixes);
  }

  if (techStack.styling) {
    const stylePrefixes = STYLING_IMPORT_PREFIXES[techStack.styling];
    if (stylePrefixes) prefixes.push(...stylePrefixes);
  }

  return prefixes;
}

export function checkStagedContent(
  files: { path: string; content: string }[],
  policies: Policy[],
  experienceLevel: ExperienceLevel,
): PolicyResult[] {
  const results: PolicyResult[] = [];
  for (const file of files) {
    results.push(...checkFile(file.path, file.content, policies, experienceLevel));
  }
  return results;
}

export function checkGitHookRules(
  projectRoot: string,
  policies: Policy[],
  experienceLevel: ExperienceLevel,
): PolicyResult[] {
  const results: PolicyResult[] = [];

  let stagedFiles: string[];
  try {
    const output = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
      cwd: projectRoot,
    });
    stagedFiles = output.trim().split("\n").filter(Boolean);
  } catch {
    return results;
  }

  for (const policy of policies) {
    for (const rule of policy.rules) {
      if (rule.detection.type !== "git-hook") continue;

      // File pattern matching (e.g., SEC-002: .env files)
      if (rule.detection.file_patterns?.length) {
        for (const staged of stagedFiles) {
          const matched = rule.detection.file_patterns.some((pattern) =>
            minimatch(staged, pattern, { matchBase: true }),
          );
          if (matched) {
            results.push({
              ruleId: rule.id,
              policyId: policy.id,
              severity: rule.severity,
              matched: true,
              file: staged,
              description: rule.description,
              teaching: getTeaching(rule, experienceLevel),
              fixSuggestion: rule.fix_suggestion,
              autoFixable: rule.auto_fixable,
            });
          }
        }
      }

      // File size threshold (e.g., REPO-001: large binaries)
      if (rule.detection.threshold_kb) {
        const thresholdBytes = rule.detection.threshold_kb * 1024;
        for (const staged of stagedFiles) {
          const fullPath = path.join(projectRoot, staged);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size > thresholdBytes) {
              results.push({
                ruleId: rule.id,
                policyId: policy.id,
                severity: rule.severity,
                matched: true,
                file: staged,
                match: `${Math.round(stat.size / 1024)}KB (threshold: ${rule.detection.threshold_kb}KB)`,
                description: rule.description,
                teaching: getTeaching(rule, experienceLevel),
                fixSuggestion: rule.fix_suggestion,
                autoFixable: rule.auto_fixable,
              });
            }
          } catch {
            // File may have been deleted
          }
        }
      }

      // Pattern matching on staged file content (e.g., TEST-002: skipped tests)
      if (rule.detection.patterns?.length && !rule.detection.file_patterns && !rule.detection.threshold_kb) {
        for (const staged of stagedFiles) {
          // Apply file_types filter if present
          if (rule.detection.file_types?.length) {
            const matched = rule.detection.file_types.some((pattern) =>
              minimatch(staged, pattern, { matchBase: true }),
            );
            if (!matched) continue;
          }

          const fullPath = path.join(projectRoot, staged);
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            for (const pattern of rule.detection.patterns) {
              const regex = new RegExp(pattern, "gm");
              const match = regex.exec(content);
              if (match) {
                // Find line number
                const lineNum = content.substring(0, match.index).split("\n").length;
                results.push({
                  ruleId: rule.id,
                  policyId: policy.id,
                  severity: rule.severity,
                  matched: true,
                  file: staged,
                  line: lineNum,
                  match: match[0],
                  description: rule.description,
                  teaching: getTeaching(rule, experienceLevel),
                  fixSuggestion: rule.fix_suggestion,
                  autoFixable: rule.auto_fixable,
                });
                break;
              }
            }
          } catch {
            // File may not be readable
          }
        }
      }
    }
  }

  return results;
}

export function checkHeuristicRules(
  projectRoot: string,
  policies: Policy[],
  experienceLevel: ExperienceLevel,
): PolicyResult[] {
  const results: PolicyResult[] = [];

  let addedFiles: string[];
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=A", {
      encoding: "utf-8",
      cwd: projectRoot,
    });
    addedFiles = output.trim().split("\n").filter(Boolean);
  } catch {
    return results;
  }

  for (const policy of policies) {
    for (const rule of policy.rules) {
      if (rule.detection.type !== "heuristic") continue;

      // TEST-001: New API routes without tests
      if (rule.detection.check === "new_files_need_tests") {
        const routePatterns = rule.detection.file_patterns ?? ["**/routes/**", "**/api/**", "**/controllers/**"];
        for (const added of addedFiles) {
          const isRoute = routePatterns.some((p) => minimatch(added, p, { matchBase: true }));
          if (!isRoute) continue;

          // Check if corresponding test file exists
          const ext = path.extname(added);
          const base = added.replace(ext, "");
          const testFiles = [
            `${base}.test${ext}`,
            `${base}.spec${ext}`,
            `${base}.test.ts`,
            `${base}.spec.ts`,
          ];
          const hasTest = testFiles.some((t) =>
            fs.existsSync(path.join(projectRoot, t)),
          );

          if (!hasTest) {
            results.push({
              ruleId: rule.id,
              policyId: policy.id,
              severity: rule.severity,
              matched: true,
              file: added,
              description: rule.description,
              teaching: getTeaching(rule, experienceLevel),
              fixSuggestion: rule.fix_suggestion,
              autoFixable: rule.auto_fixable,
            });
          }
        }
      }
    }
  }

  return results;
}

export function checkActionRules(
  projectRoot: string,
  policies: Policy[],
  experienceLevel: ExperienceLevel,
): PolicyResult[] {
  const results: PolicyResult[] = [];

  for (const policy of policies) {
    for (const rule of policy.rules) {
      if (rule.detection.type !== "action") continue;

      // COST-002: Duplicate-purpose dependencies
      if (rule.detection.check === "duplicate_deps") {
        const pkgPath = path.join(projectRoot, "package.json");
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
          };
          const allDeps = Object.keys({
            ...pkg.dependencies,
            ...pkg.devDependencies,
          });

          for (const [group, packages] of Object.entries(DUPLICATE_PURPOSE_GROUPS) as [string, string[]][]) {
            const found = packages.filter((p: string) => allDeps.includes(p));
            if (found.length > 1) {
              results.push({
                ruleId: rule.id,
                policyId: policy.id,
                severity: rule.severity,
                matched: true,
                file: "package.json",
                match: `Duplicate ${group}: ${found.join(", ")}`,
                description: rule.description,
                teaching: getTeaching(rule, experienceLevel),
                fixSuggestion: rule.fix_suggestion ?? `Remove duplicate ${group} packages. Keep one: ${found.join(" or ")}`,
                autoFixable: rule.auto_fixable,
              });
            }
          }
        } catch {
          // package.json not readable
        }
      }
    }
  }

  return results;
}

function getTeaching(rule: PolicyRule, level: ExperienceLevel): string {
  if (rule.teaching) {
    return rule.teaching[level] ?? rule.teaching.intermediate ?? rule.description;
  }
  return rule.description;
}
