import fs from "node:fs";
import path from "node:path";
import { SOPHIA_DIR } from "@sophia-code/shared";
import type { PolicyRule, ExperienceLevel, TeachingMoment, ExplainContent } from "@sophia-code/shared";
import { getDb } from "./database.js";

export function generateTeaching(
  rule: PolicyRule,
  policyId: string,
  level: ExperienceLevel,
  isFirstEncounter: boolean,
): TeachingMoment {
  if (level === "advanced") {
    return {
      severity: rule.severity,
      headline: `${rule.id}: ${rule.name}`,
      explanation: rule.teaching?.advanced ?? rule.description,
      fixSuggestion: rule.fix_suggestion ?? "",
      ruleReference: `${policyId}.${rule.id}`,
    };
  }

  if (level === "intermediate") {
    return {
      severity: rule.severity,
      headline: rule.name,
      explanation: rule.teaching?.intermediate ?? rule.description,
      fixSuggestion: rule.fix_suggestion ?? "",
      ruleReference: `${policyId}.${rule.id}`,
      learnMore: rule.teaching?.topic
        ? `sophia explain ${rule.teaching.topic}`
        : undefined,
    };
  }

  return {
    severity: rule.severity,
    headline: isFirstEncounter
      ? `New Concept: ${rule.name}`
      : `Reminder: ${rule.name}`,
    explanation: rule.teaching?.beginner ?? rule.description,
    codeExample: rule.teaching?.code_example,
    fixSuggestion: rule.fix_suggestion ?? "",
    learnMore: rule.teaching?.topic
      ? `sophia explain ${rule.teaching.topic}`
      : undefined,
    ruleReference: `${policyId} > ${rule.id}`,
  };
}

export function isFirstEncounter(projectRoot: string, ruleId: string): boolean {
  try {
    const db = getDb(projectRoot);
    const row = db
      .prepare("SELECT rule_id FROM encounters WHERE rule_id = ?")
      .get(ruleId);
    return !row;
  } catch {
    return true;
  }
}

export function markEncountered(projectRoot: string, ruleId: string): void {
  try {
    const db = getDb(projectRoot);
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO encounters (rule_id, first_seen_at, times_seen, last_seen_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(rule_id) DO UPDATE SET
         times_seen = times_seen + 1,
         last_seen_at = ?`,
    ).run(ruleId, now, now, now);
  } catch {
    // Silently skip if db not available
  }
}

export function loadExplainContent(
  projectRoot: string,
  topic: string,
): ExplainContent | null {
  const teachingDir = path.join(projectRoot, SOPHIA_DIR, "teaching");
  const filePath = path.join(teachingDir, `${topic}.md`);

  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, "utf-8");
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const policyMatches = content.match(/- (SEC|QA|TEST|COST|REPO)-\d+/g);
  const patternMatches = content.match(/\.sophia\/patterns\/[\w-]+\.md/g);

  return {
    topic,
    title: titleMatch?.[1] ?? topic,
    content,
    relatedPolicies: policyMatches?.map((m) => m.replace("- ", "")) ?? [],
    relatedPatterns: patternMatches ?? [],
  };
}

export function listTopics(projectRoot: string): string[] {
  const teachingDir = path.join(projectRoot, SOPHIA_DIR, "teaching");
  if (!fs.existsSync(teachingDir)) return [];

  return fs
    .readdirSync(teachingDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""));
}
