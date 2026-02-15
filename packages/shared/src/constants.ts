export const SOPHIA_VERSION = "1.0.0";
export const SOPHIA_DIR = ".sophia";
export const SOPHIA_DB_FILE = "sophia.db";
export const SOPHIA_CONFIG_FILE = "config.yaml";
export const SOPHIA_DASHBOARD_PORT = 9473;
export const SOPHIA_WS_PORT = 9474;

export const MARKER_START = "<!-- SOPHIA:BEGIN - Auto-managed by sophia.code -->";
export const MARKER_END = "<!-- SOPHIA:END -->";

export const STALE_SESSION_TIMEOUT_MINUTES = 30;

export const DEFAULT_EXPERIENCE_LEVEL = "beginner" as const;
export const DEFAULT_GOVERNANCE_LEVEL = "enterprise" as const;
export const DEFAULT_CLAIM_MODE = "warn" as const;
export const DEFAULT_STRICTNESS = "strict" as const;

export const AGENT_SIGNATURES = [
  {
    name: "claude-code" as const,
    displayName: "Claude Code",
    configFiles: ["CLAUDE.md"],
    globalFiles: ["~/.claude/CLAUDE.md"],
  },
  {
    name: "opencode" as const,
    displayName: "OpenCode",
    configFiles: ["AGENTS.md"],
    globalFiles: [],
  },
  {
    name: "cursor" as const,
    displayName: "Cursor",
    configFiles: [".cursorrules", ".cursor/rules/sophia.md"],
    globalFiles: [],
  },
  {
    name: "copilot" as const,
    displayName: "GitHub Copilot",
    configFiles: [".github/copilot-instructions.md"],
    globalFiles: [],
  },
] as const;

export const TECH_STACK_FILES: Record<string, { language: string; framework?: string }> = {
  "package.json": { language: "typescript" },
  "requirements.txt": { language: "python" },
  "go.mod": { language: "go" },
  "Cargo.toml": { language: "rust" },
  "pom.xml": { language: "java" },
  "build.gradle": { language: "java" },
};

export const FRAMEWORK_FILES: Record<string, string> = {
  "next.config.js": "next.js",
  "next.config.ts": "next.js",
  "next.config.mjs": "next.js",
  "angular.json": "angular",
  "nuxt.config.ts": "nuxt",
  "svelte.config.js": "svelte",
  "astro.config.mjs": "astro",
  "remix.config.js": "remix",
};

export const TEST_RUNNER_FILES: Record<string, string> = {
  "vitest.config.ts": "vitest",
  "vitest.config.js": "vitest",
  "jest.config.ts": "jest",
  "jest.config.js": "jest",
  "jest.config.json": "jest",
  "pytest.ini": "pytest",
  "pyproject.toml": "pytest",
  ".mocharc.yml": "mocha",
};

export const ORM_FILES: Record<string, string> = {
  "prisma/schema.prisma": "prisma",
  "drizzle.config.ts": "drizzle",
  "typeorm.config.ts": "typeorm",
  "knexfile.js": "knex",
};

export const PACKAGE_MANAGER_FILES: Record<string, string> = {
  "bun.lockb": "bun",
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
  "package-lock.json": "npm",
};

export const UI_FRAMEWORK_PACKAGES: Record<string, string> = {
  "@radix-ui/react-dialog": "shadcn",
  "@radix-ui/react-slot": "shadcn",
  "@mui/material": "mui",
  "@chakra-ui/react": "chakra",
  antd: "ant-design",
  "@headlessui/react": "headless-ui",
  "@mantine/core": "mantine",
};

export const STYLING_PACKAGES: Record<string, string> = {
  tailwindcss: "tailwind",
  "styled-components": "styled-components",
  "@emotion/styled": "emotion",
  sass: "sass",
  "less": "less",
};

export const STATE_MANAGEMENT_PACKAGES: Record<string, string> = {
  "@reduxjs/toolkit": "redux",
  zustand: "zustand",
  jotai: "jotai",
  recoil: "recoil",
  mobx: "mobx",
  valtio: "valtio",
};

export const GOVERNANCE_POLICY_SETS: Record<string, string[]> = {
  community: ["security", "quality"],
  startup: ["security", "quality", "testing", "repo-hygiene", "ui-standards"],
  enterprise: ["security", "quality", "testing", "repo-hygiene", "ui-standards", "cost"],
};

export const STRICTNESS_SEVERITY_BLOCKS: Record<string, string[]> = {
  permissive: [],
  moderate: ["red"],
  strict: ["red", "yellow"],
};

// Maps detected ui_framework value → import path prefixes that belong to it
export const UI_FRAMEWORK_IMPORT_PREFIXES: Record<string, string[]> = {
  shadcn: ["@radix-ui/"],
  mui: ["@mui/"],
  chakra: ["@chakra-ui/"],
  "ant-design": ["antd"],
  "headless-ui": ["@headlessui/"],
  mantine: ["@mantine/"],
};

// Maps detected styling value → import path prefixes that belong to it
export const STYLING_IMPORT_PREFIXES: Record<string, string[]> = {
  tailwind: ["tailwindcss"],
  "styled-components": ["styled-components"],
  emotion: ["@emotion/"],
  sass: ["sass"],
  less: ["less"],
};

export const DUPLICATE_PURPOSE_GROUPS: Record<string, string[]> = {
  "http-client": ["axios", "got", "node-fetch", "ky", "superagent"],
  "date-library": ["moment", "date-fns", "dayjs", "luxon"],
  "test-runner": ["jest", "mocha", "vitest", "ava"],
  "css-in-js": ["styled-components", "@emotion/styled", "@emotion/css"],
};
