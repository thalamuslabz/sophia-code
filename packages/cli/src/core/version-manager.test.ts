/**
 * Unit Tests: Version Manager
 *
 * Tests version parsing, comparison, and enforcement logic
 */

import { describe, it, expect } from "vitest";
import { compareVersions } from "./version-manager.js";

describe("Version Manager", () => {
  describe("compareVersions", () => {
    it("returns 0 for identical versions", () => {
      expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
      expect(compareVersions("2.5.3", "2.5.3")).toBe(0);
    });

    it("returns -1 when a < b", () => {
      expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
      expect(compareVersions("1.0.0", "1.1.0")).toBe(-1);
      expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
    });

    it("returns 1 when a > b", () => {
      expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
      expect(compareVersions("1.1.0", "1.0.0")).toBe(1);
      expect(compareVersions("1.0.1", "1.0.0")).toBe(1);
    });

    it("handles v-prefix", () => {
      expect(compareVersions("v1.0.0", "1.0.0")).toBe(0);
      expect(compareVersions("v1.0.0", "2.0.0")).toBe(-1);
    });

    it("handles different length versions", () => {
      expect(compareVersions("1.0", "1.0.0")).toBe(0);
      expect(compareVersions("1", "1.0.0")).toBe(0);
      expect(compareVersions("1.0", "1.0.1")).toBe(-1);
    });
  });
});
