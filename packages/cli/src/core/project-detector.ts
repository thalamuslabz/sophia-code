import fs from "node:fs";
import path from "node:path";
import {
  TECH_STACK_FILES,
  FRAMEWORK_FILES,
  TEST_RUNNER_FILES,
  ORM_FILES,
  PACKAGE_MANAGER_FILES,
  UI_FRAMEWORK_PACKAGES,
  STYLING_PACKAGES,
  STATE_MANAGEMENT_PACKAGES,
} from "@sophia-code/shared";
import type { ProjectProfile } from "@sophia-code/shared";

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function detectProject(projectRoot: string): ProjectProfile {
  const language = detectLanguage(projectRoot);
  const framework = detectFramework(projectRoot);
  const testRunner = detectTestRunner(projectRoot);
  const orm = detectOrm(projectRoot);
  const packageManager = detectPackageManager(projectRoot);
  const database = detectDatabase(projectRoot);
  const uiFramework = detectUIFramework(projectRoot);
  const styling = detectStyling(projectRoot);
  const stateManagement = detectStateManagement(projectRoot);

  return {
    language,
    framework: framework ?? undefined,
    database: database ?? undefined,
    orm: orm ?? undefined,
    packageManager,
    testRunner: testRunner ?? undefined,
    uiFramework: uiFramework ?? undefined,
    styling: styling ?? undefined,
    stateManagement: stateManagement ?? undefined,
  };
}

function detectLanguage(root: string): string {
  for (const [file, info] of Object.entries(TECH_STACK_FILES)) {
    if (fs.existsSync(path.join(root, file))) {
      if (file === "package.json") {
        const pkg = readPackageJson(path.join(root, file));
        if (
          pkg?.devDependencies?.["typescript"] ||
          pkg?.dependencies?.["typescript"] ||
          fs.existsSync(path.join(root, "tsconfig.json"))
        ) {
          return "typescript";
        }
        return "javascript";
      }
      return info.language;
    }
  }
  return "unknown";
}

function detectFramework(root: string): string | null {
  for (const [file, framework] of Object.entries(FRAMEWORK_FILES)) {
    if (fs.existsSync(path.join(root, file))) {
      return framework;
    }
  }

  const pkg = readPackageJson(path.join(root, "package.json"));
  if (pkg) {
    const deps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    if (deps["next"]) return "next.js";
    if (deps["@angular/core"]) return "angular";
    if (deps["vue"]) return "vue";
    if (deps["svelte"]) return "svelte";
    if (deps["express"]) return "express";
    if (deps["fastify"]) return "fastify";
    if (deps["react"]) return "react";
  }

  return null;
}

function detectTestRunner(root: string): string | null {
  for (const [file, runner] of Object.entries(TEST_RUNNER_FILES)) {
    if (fs.existsSync(path.join(root, file))) {
      return runner;
    }
  }

  const pkg = readPackageJson(path.join(root, "package.json"));
  if (pkg) {
    const deps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    if (deps["vitest"]) return "vitest";
    if (deps["jest"]) return "jest";
    if (deps["mocha"]) return "mocha";
  }

  return null;
}

function detectOrm(root: string): string | null {
  for (const [file, orm] of Object.entries(ORM_FILES)) {
    if (fs.existsSync(path.join(root, file))) {
      return orm;
    }
  }
  return null;
}

function detectDatabase(root: string): string | null {
  const pkg = readPackageJson(path.join(root, "package.json"));
  if (pkg) {
    const deps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    if (deps["pg"] || deps["postgres"]) return "postgresql";
    if (deps["mysql2"] || deps["mysql"]) return "mysql";
    if (deps["mongodb"] || deps["mongoose"]) return "mongodb";
    if (deps["better-sqlite3"] || deps["sqlite3"]) return "sqlite";
  }
  return null;
}

function detectPackageManager(root: string): string {
  for (const [file, manager] of Object.entries(PACKAGE_MANAGER_FILES)) {
    if (fs.existsSync(path.join(root, file))) {
      return manager;
    }
  }
  return "npm";
}

function detectUIFramework(root: string): string | null {
  const pkg = readPackageJson(path.join(root, "package.json"));
  if (!pkg) return null;
  const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const [pkgName, framework] of Object.entries(UI_FRAMEWORK_PACKAGES) as [string, string][]) {
    if (deps[pkgName]) return framework;
  }
  return null;
}

function detectStyling(root: string): string | null {
  const pkg = readPackageJson(path.join(root, "package.json"));
  if (!pkg) return null;
  const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const [pkgName, style] of Object.entries(STYLING_PACKAGES) as [string, string][]) {
    if (deps[pkgName]) return style;
  }
  return null;
}

function detectStateManagement(root: string): string | null {
  const pkg = readPackageJson(path.join(root, "package.json"));
  if (!pkg) return null;
  const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const [pkgName, lib] of Object.entries(STATE_MANAGEMENT_PACKAGES) as [string, string][]) {
    if (deps[pkgName]) return lib;
  }
  return null;
}

function readPackageJson(filePath: string): PackageJson | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as PackageJson;
  } catch {
    return null;
  }
}
