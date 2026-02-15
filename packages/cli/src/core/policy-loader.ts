import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { PolicyFileSchema } from "@sophia-code/shared";
import type { Policy, PolicyRule } from "@sophia-code/shared";

export function loadPolicies(policiesDir: string): Policy[] {
  if (!fs.existsSync(policiesDir)) return [];

  const files = fs
    .readdirSync(policiesDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  const policies: Policy[] = [];

  for (const file of files) {
    const filePath = path.join(policiesDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const raw = YAML.parse(content) as unknown;

    try {
      const parsed = PolicyFileSchema.parse(raw);
      policies.push({
        id: parsed.policy.id,
        name: parsed.policy.name,
        version: parsed.policy.version,
        description: parsed.policy.description,
        rules: parsed.rules.map((r) => ({
          ...r,
          auto_fixable: r.auto_fixable ?? false,
        })),
      });
    } catch (err) {
      console.error(`Warning: Failed to parse policy file ${file}:`, err);
    }
  }

  return policies;
}

export function findRule(
  policies: Policy[],
  ruleId: string,
): { policy: Policy; rule: PolicyRule } | null {
  for (const policy of policies) {
    const rule = policy.rules.find((r) => r.id === ruleId);
    if (rule) return { policy, rule };
  }
  return null;
}
