import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadPolicies, findRule } from "./policy-loader.js";

describe("policy-loader", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-policy-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const validPolicyYaml = [
    "policy:",
    "  id: sec-001",
    "  name: Security Policy",
    '  version: "1.0"',
    "  description: Test security policy",
    "rules:",
    "  - id: no-secrets",
    "    name: No Hardcoded Secrets",
    "    severity: red",
    "    description: Do not hardcode secrets",
    "    detection:",
    "      type: pattern",
    "      patterns:",
    "        - password=secret",
    "      file_types:",
    '        - "*.ts"',
    "    auto_fixable: false",
  ].join("\n");

  const secondPolicyYaml = [
    "policy:",
    "  id: style-001",
    "  name: Style Policy",
    '  version: "1.0"',
    "rules:",
    "  - id: no-console",
    "    name: No Console Logs",
    "    severity: yellow",
    "    description: Avoid console.log in production",
    "    detection:",
    "      type: pattern",
    "      patterns:",
    "        - console.log",
    "    auto_fixable: false",
  ].join("\n");

  describe("loadPolicies", () => {
    it("loads YAML files from directory", () => {
      fs.writeFileSync(path.join(tmpDir, "security.yaml"), validPolicyYaml);
      fs.writeFileSync(path.join(tmpDir, "style.yml"), secondPolicyYaml);

      const policies = loadPolicies(tmpDir);

      expect(policies).toHaveLength(2);
      expect(policies.map((p) => p.id)).toContain("sec-001");
      expect(policies.map((p) => p.id)).toContain("style-001");
    });

    it("returns empty array for missing directory", () => {
      const missing = path.join(tmpDir, "nonexistent");
      const policies = loadPolicies(missing);
      expect(policies).toEqual([]);
    });

    it("skips invalid YAML files and logs warning", () => {
      fs.writeFileSync(path.join(tmpDir, "valid.yaml"), validPolicyYaml);
      fs.writeFileSync(
        path.join(tmpDir, "invalid.yaml"),
        "not_a_policy: true\nfoo: bar",
      );

      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      const policies = loadPolicies(tmpDir);

      expect(policies).toHaveLength(1);
      expect(policies[0]!.id).toBe("sec-001");
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    it("ignores non-YAML files", () => {
      fs.writeFileSync(path.join(tmpDir, "security.yaml"), validPolicyYaml);
      fs.writeFileSync(path.join(tmpDir, "readme.txt"), "not a policy");

      const policies = loadPolicies(tmpDir);
      expect(policies).toHaveLength(1);
    });

    it("sets auto_fixable to false when not specified", () => {
      fs.writeFileSync(path.join(tmpDir, "policy.yaml"), validPolicyYaml);
      const policies = loadPolicies(tmpDir);
      expect(policies[0]!.rules[0]!.auto_fixable).toBe(false);
    });
  });

  describe("findRule", () => {
    it("finds existing rule by ID", () => {
      fs.writeFileSync(path.join(tmpDir, "security.yaml"), validPolicyYaml);
      fs.writeFileSync(path.join(tmpDir, "style.yml"), secondPolicyYaml);
      const policies = loadPolicies(tmpDir);

      const result = findRule(policies, "no-console");

      expect(result).not.toBeNull();
      expect(result!.rule.id).toBe("no-console");
      expect(result!.policy.id).toBe("style-001");
    });

    it("returns null for missing rule", () => {
      fs.writeFileSync(path.join(tmpDir, "security.yaml"), validPolicyYaml);
      const policies = loadPolicies(tmpDir);

      const result = findRule(policies, "nonexistent-rule");
      expect(result).toBeNull();
    });

    it("returns null for empty policies array", () => {
      const result = findRule([], "any-rule");
      expect(result).toBeNull();
    });
  });
});
