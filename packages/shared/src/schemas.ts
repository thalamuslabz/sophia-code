import { z } from "zod";

export const TechStackSchema = z.object({
  language: z.string(),
  framework: z.string().optional(),
  database: z.string().optional(),
  orm: z.string().optional(),
  package_manager: z.string(),
  test_runner: z.string().optional(),
  ui_framework: z.string().optional(),
  styling: z.string().optional(),
  state_management: z.string().optional(),
});

export const ConventionRuleSchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
});

export const ConventionsConfigSchema = z.object({
  rules: z.array(ConventionRuleSchema),
});

export const DetectedAgentConfigSchema = z.object({
  name: z.string(),
  config_file: z.string(),
  status: z.enum(["active", "detected", "disabled"]),
});

export const PolicyOverrideSchema = z.object({
  severity: z.enum(["green", "yellow", "red"]).optional(),
  enabled: z.boolean().optional(),
});

export const SophiaConfigSchema = z.object({
  sophia: z.object({
    version: z.string(),
    initialized: z.string(),
  }),
  project: z.object({
    name: z.string(),
    tech_stack: TechStackSchema,
    detected_at: z.string(),
    conventions: ConventionsConfigSchema.optional(),
  }),
  agents: z.object({
    detected: z.array(DetectedAgentConfigSchema),
  }),
  user: z.object({
    experience_level: z.enum(["beginner", "intermediate", "advanced"]),
    governance_level: z.enum(["community", "startup", "enterprise"]),
  }),
  session: z.object({
    auto_detect: z.boolean(),
    stale_timeout_minutes: z.number().min(1),
    claim_mode: z.enum(["warn", "block", "off"]),
  }),
  policies: z.object({
    enabled: z.array(z.string()),
    strictness: z.enum(["permissive", "moderate", "strict"]),
    overrides: z.record(z.string(), PolicyOverrideSchema).optional(),
  }),
  teaching: z.object({
    enabled: z.boolean(),
    show_explanations: z.boolean(),
    first_time_hints: z.boolean(),
  }),
  health: z.object({
    auto_score: z.boolean(),
    score_on_commit: z.boolean(),
  }),
});

export const PolicyDetectionSchema = z.object({
  type: z.enum(["pattern", "git-hook", "heuristic", "action"]).optional(),
  patterns: z.array(z.string()).optional(),
  file_types: z.array(z.string()).optional(),
  file_patterns: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  context_required: z.boolean().optional(),
  trigger: z.string().optional(),
  check: z.string().optional(),
  threshold_kb: z.number().optional(),
});

export const PolicyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  severity: z.enum(["green", "yellow", "red"]),
  description: z.string(),
  detection: PolicyDetectionSchema,
  teaching: z.object({
    beginner: z.string().optional(),
    intermediate: z.string().optional(),
    advanced: z.string().optional(),
    topic: z.string().optional(),
    code_example: z.object({
      wrong: z.string(),
      right: z.string(),
    }).optional(),
  }).optional(),
  fix_suggestion: z.string().optional(),
  auto_fixable: z.boolean(),
});

export const PolicyFileSchema = z.object({
  policy: z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
  }),
  rules: z.array(PolicyRuleSchema),
});

export const DedupMappingSchema = z.object({
  semantic_groups: z.array(z.object({
    group: z.string(),
    sophia_rule: z.string(),
    patterns: z.array(z.string()),
  })),
});
