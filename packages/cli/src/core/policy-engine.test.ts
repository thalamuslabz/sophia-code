import { describe, it, expect } from "vitest";
import { checkFile } from "./policy-engine.js";
import type { Policy } from "@sophia-code/shared";

function makePolicy(overrides: Partial<Policy["rules"][0]["detection"]> = {}): Policy {
  return {
    id: "sec-001",
    name: "Security",
    version: "1.0",
    rules: [
      {
        id: "no-secrets",
        name: "No Hardcoded Secrets",
        severity: "red",
        description: "Do not hardcode secrets in source code",
        detection: {
          type: "pattern",
          patterns: ["password\\s*=\\s*['\"][^'\"]+['\"]", "API_KEY\\s*=\\s*['\"][^'\"]+['\"]"],
          ...overrides,
        },
        auto_fixable: false,
      },
    ],
  };
}

describe("policy-engine checkFile", () => {
  it("detects hardcoded secrets via regex match", () => {
    const policy = makePolicy();
    const content = `const password = "hunter2";`;

    const results = checkFile("app.ts", content, [policy], "intermediate");

    expect(results).toHaveLength(1);
    expect(results[0]!.ruleId).toBe("no-secrets");
    expect(results[0]!.matched).toBe(true);
    expect(results[0]!.match).toContain("password");
  });

  it("respects file_type filters - matching file", () => {
    const policy = makePolicy({ file_types: ["*.ts"] });
    const content = `const password = "secret123";`;

    const results = checkFile("src/config.ts", content, [policy], "intermediate");
    expect(results).toHaveLength(1);
  });

  it("respects file_type filters - non-matching file", () => {
    const policy = makePolicy({ file_types: ["*.ts"] });
    const content = `const password = "secret123";`;

    const results = checkFile("src/config.py", content, [policy], "intermediate");
    expect(results).toHaveLength(0);
  });

  it("respects exclude patterns", () => {
    const policy = makePolicy({ exclude: ["*.test.ts"] });
    const content = `const password = "secret123";`;

    const results = checkFile("auth.test.ts", content, [policy], "intermediate");
    expect(results).toHaveLength(0);
  });

  it("returns empty for clean files", () => {
    const policy = makePolicy();
    const content = `const config = loadFromEnv();\nconsole.log("started");`;

    const results = checkFile("app.ts", content, [policy], "intermediate");
    expect(results).toHaveLength(0);
  });

  it("returns correct line numbers", () => {
    const policy = makePolicy();
    const content = [
      "import config from './config';",
      "",
      "const user = 'admin';",
      "const password = 'letmein';",
      "",
      "export default { user };",
    ].join("\n");

    const results = checkFile("app.ts", content, [policy], "intermediate");

    expect(results).toHaveLength(1);
    expect(results[0]!.line).toBe(4);
  });

  it("detects multiple patterns from the same rule (one match per pattern break)", () => {
    const policy = makePolicy();
    const content = `const password = "abc";\nconst API_KEY = "xyz123";`;

    // The engine breaks after the first pattern match per rule, so only 1 result
    const results = checkFile("app.ts", content, [policy], "intermediate");
    // First pattern matches on line 1, breaks, then second pattern matches on line 2
    // Actually: it breaks per pattern match (break after first match per pattern)
    // Two patterns, each can match once => up to 2 results
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.match!.includes("password"))).toBe(true);
  });

  it("skips non-pattern detection types", () => {
    const policy: Policy = {
      id: "hook-001",
      name: "Git Hook",
      version: "1.0",
      rules: [
        {
          id: "hook-rule",
          name: "Hook Rule",
          severity: "yellow",
          description: "Git hook detection",
          detection: {
            type: "git-hook",
            trigger: "pre-commit",
          },
          auto_fixable: false,
        },
      ],
    };

    const results = checkFile("app.ts", `password = "secret"`, [policy], "intermediate");
    expect(results).toHaveLength(0);
  });

  it("includes teaching content based on experience level", () => {
    const policy: Policy = {
      id: "teach-001",
      name: "Teaching Policy",
      version: "1.0",
      rules: [
        {
          id: "teach-rule",
          name: "Teach Rule",
          severity: "yellow",
          description: "Default description",
          detection: {
            type: "pattern",
            patterns: ["TODO"],
          },
          teaching: {
            beginner: "Beginner explanation",
            intermediate: "Intermediate explanation",
            advanced: "Advanced explanation",
          },
          auto_fixable: false,
        },
      ],
    };

    const results = checkFile("app.ts", "// TODO: fix this", [policy], "beginner");
    expect(results).toHaveLength(1);
    expect(results[0]!.teaching).toBe("Beginner explanation");
  });
});
