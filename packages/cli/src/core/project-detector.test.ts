import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { detectProject } from "./project-detector";

describe("project-detector", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("detectProject", () => {
    it("detects TypeScript from tsconfig.json", () => {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ name: "test", devDependencies: { typescript: "^5.0.0" } }),
      );
      fs.writeFileSync(path.join(tmpDir, "tsconfig.json"), "{}");

      const profile = detectProject(tmpDir);
      expect(profile.language).toBe("typescript");
    });

    it("detects JavaScript from package.json without TypeScript", () => {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ name: "test", dependencies: { express: "^4.0.0" } }),
      );

      const profile = detectProject(tmpDir);
      expect(profile.language).toBe("javascript");
    });

    it("detects Next.js framework from dependency", () => {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({
          name: "test",
          dependencies: { next: "^14.0.0", react: "^18.0.0" },
          devDependencies: { typescript: "^5.0.0" },
        }),
      );

      const profile = detectProject(tmpDir);
      expect(profile.framework).toBe("next.js");
    });

    it("detects Next.js framework from config file", () => {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ name: "test" }),
      );
      fs.writeFileSync(path.join(tmpDir, "next.config.js"), "module.exports = {}");

      const profile = detectProject(tmpDir);
      expect(profile.framework).toBe("next.js");
    });

    it("detects vitest test runner from config file", () => {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ name: "test" }),
      );
      fs.writeFileSync(path.join(tmpDir, "vitest.config.ts"), "export default {}");

      const profile = detectProject(tmpDir);
      expect(profile.testRunner).toBe("vitest");
    });

    it("detects vitest test runner from package.json dependency", () => {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({
          name: "test",
          devDependencies: { vitest: "^1.0.0" },
        }),
      );

      const profile = detectProject(tmpDir);
      expect(profile.testRunner).toBe("vitest");
    });

    it("returns unknown language for empty project", () => {
      const profile = detectProject(tmpDir);
      expect(profile.language).toBe("unknown");
      expect(profile.framework).toBeUndefined();
      expect(profile.testRunner).toBeUndefined();
      expect(profile.database).toBeUndefined();
      expect(profile.orm).toBeUndefined();
      expect(profile.packageManager).toBe("npm");
    });

    it("detects pnpm package manager from lock file", () => {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ name: "test" }),
      );
      fs.writeFileSync(path.join(tmpDir, "pnpm-lock.yaml"), "");

      const profile = detectProject(tmpDir);
      expect(profile.packageManager).toBe("pnpm");
    });

    it("detects prisma ORM", () => {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ name: "test" }),
      );
      const prismaDir = path.join(tmpDir, "prisma");
      fs.mkdirSync(prismaDir);
      fs.writeFileSync(path.join(prismaDir, "schema.prisma"), "");

      const profile = detectProject(tmpDir);
      expect(profile.orm).toBe("prisma");
    });

    it("detects postgresql database from pg dependency", () => {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({
          name: "test",
          dependencies: { pg: "^8.0.0" },
        }),
      );

      const profile = detectProject(tmpDir);
      expect(profile.database).toBe("postgresql");
    });
  });
});
