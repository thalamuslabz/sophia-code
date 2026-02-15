import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { detectAgents, toAgentConfigs } from "./agent-detector";
import { MARKER_START } from "@sophia-code/shared";

describe("agent-detector", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("detectAgents", () => {
    it("finds CLAUDE.md as claude-code agent", () => {
      fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "# Claude instructions");

      const agents = detectAgents(tmpDir);
      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe("claude-code");
      expect(agents[0].displayName).toBe("Claude Code");
      expect(agents[0].configFile).toBe("CLAUDE.md");
      expect(agents[0].configExists).toBe(true);
      expect(agents[0].existingContent).toBe("# Claude instructions");
      expect(agents[0].hasSophiaBlock).toBe(false);
    });

    it("finds AGENTS.md as opencode agent", () => {
      fs.writeFileSync(path.join(tmpDir, "AGENTS.md"), "# Agents");

      const agents = detectAgents(tmpDir);
      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe("opencode");
      expect(agents[0].displayName).toBe("OpenCode");
      expect(agents[0].configFile).toBe("AGENTS.md");
    });

    it("finds .cursorrules as cursor agent", () => {
      fs.writeFileSync(path.join(tmpDir, ".cursorrules"), "rules here");

      const agents = detectAgents(tmpDir);
      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe("cursor");
      expect(agents[0].displayName).toBe("Cursor");
      expect(agents[0].configFile).toBe(".cursorrules");
    });

    it("finds copilot instructions", () => {
      const copilotDir = path.join(tmpDir, ".github");
      fs.mkdirSync(copilotDir, { recursive: true });
      fs.writeFileSync(
        path.join(copilotDir, "copilot-instructions.md"),
        "# Copilot",
      );

      const agents = detectAgents(tmpDir);
      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe("copilot");
      expect(agents[0].displayName).toBe("GitHub Copilot");
      expect(agents[0].configFile).toBe(".github/copilot-instructions.md");
    });

    it("returns empty array when no agents are present", () => {
      const agents = detectAgents(tmpDir);
      expect(agents).toEqual([]);
    });

    it("detects multiple agents simultaneously", () => {
      fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "claude");
      fs.writeFileSync(path.join(tmpDir, ".cursorrules"), "cursor");

      const agents = detectAgents(tmpDir);
      expect(agents).toHaveLength(2);
      const names = agents.map((a) => a.name);
      expect(names).toContain("claude-code");
      expect(names).toContain("cursor");
    });

    it("detects hasSophiaBlock when marker is present", () => {
      fs.writeFileSync(
        path.join(tmpDir, "CLAUDE.md"),
        `# My rules\n\n${MARKER_START}\nsome sophia content\n`,
      );

      const agents = detectAgents(tmpDir);
      expect(agents[0].hasSophiaBlock).toBe(true);
    });
  });

  describe("toAgentConfigs", () => {
    it("converts DetectedAgent array to DetectedAgentConfig array", () => {
      fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "content");
      fs.writeFileSync(path.join(tmpDir, "AGENTS.md"), "content");

      const agents = detectAgents(tmpDir);
      const configs = toAgentConfigs(agents);

      expect(configs).toHaveLength(2);
      expect(configs[0]).toEqual({
        name: "claude-code",
        config_file: "CLAUDE.md",
        status: "active",
      });
      expect(configs[1]).toEqual({
        name: "opencode",
        config_file: "AGENTS.md",
        status: "active",
      });
    });

    it("returns empty array for empty input", () => {
      expect(toAgentConfigs([])).toEqual([]);
    });
  });
});
