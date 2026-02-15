import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { SOPHIA_DIR } from "@sophia-code/shared";
import type { DedupMapping } from "@sophia-code/shared";
import { DedupMappingSchema } from "@sophia-code/shared";

interface DedupResult {
  ruleId: string;
  skipped: boolean;
  reason?: string;
}

export function loadDedupMappings(projectRoot: string): DedupMapping[] {
  const mappingPath = path.join(
    projectRoot,
    SOPHIA_DIR,
    "adapters",
    "mappings",
    "rule-dedup.yaml",
  );

  if (!fs.existsSync(mappingPath)) return [];

  try {
    const content = fs.readFileSync(mappingPath, "utf-8");
    const parsed = DedupMappingSchema.parse(YAML.parse(content) as unknown);
    return parsed.semantic_groups;
  } catch {
    return [];
  }
}

export function findDuplicateRules(
  existingContent: string,
  mappings: DedupMapping[],
): DedupResult[] {
  const results: DedupResult[] = [];
  const contentLower = existingContent.toLowerCase();

  for (const group of mappings) {
    const matchCount = group.patterns.filter((p: string) =>
      contentLower.includes(p.toLowerCase()),
    ).length;

    const threshold = Math.max(2, Math.ceil(group.patterns.length * 0.3));

    results.push({
      ruleId: group.sophia_rule,
      skipped: matchCount >= threshold,
      reason:
        matchCount >= threshold
          ? `Existing content already covers ${group.group} (${matchCount}/${group.patterns.length} keywords matched)`
          : undefined,
    });
  }

  return results;
}

export function getDedupedRuleIds(
  existingContent: string,
  projectRoot: string,
): string[] {
  const mappings = loadDedupMappings(projectRoot);
  const results = findDuplicateRules(existingContent, mappings);
  return results.filter((r) => r.skipped).map((r) => r.ruleId);
}
