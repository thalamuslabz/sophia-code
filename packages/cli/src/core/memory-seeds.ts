import type { ProjectProfile } from "@sophia-code/shared";
import { getDb } from "./database.js";

interface SeedCorrection {
  pattern: string;
  reason: string;
  correction: string;
  keywords: string[];
  severity: "low" | "medium" | "high";
}

const SEED_CORRECTIONS: Record<string, SeedCorrection[]> = {
  "next.js": [
    {
      pattern: "Using getServerSideProps for static data",
      reason: "Static data should use getStaticProps for better performance",
      correction: "Use getStaticProps with revalidate for ISR",
      keywords: ["next", "ssr", "ssg", "performance"],
      severity: "medium",
    },
    {
      pattern: "Exposing server-side env vars to client",
      reason: "Only NEXT_PUBLIC_ prefixed vars are safe for client",
      correction: "Prefix client-safe vars with NEXT_PUBLIC_",
      keywords: ["next", "env", "security", "client"],
      severity: "high",
    },
    {
      pattern: "Using Image component without width/height",
      reason: "Next.js Image requires dimensions for layout optimization",
      correction: "Always provide width and height, or use fill with a sized container",
      keywords: ["next", "image", "performance", "layout"],
      severity: "low",
    },
  ],
  prisma: [
    {
      pattern: "Creating new PrismaClient in every request",
      reason: "Causes connection pool exhaustion in development",
      correction: "Use singleton pattern with global PrismaClient",
      keywords: ["prisma", "database", "connection", "singleton"],
      severity: "high",
    },
    {
      pattern: "Not using select/include to limit query fields",
      reason: "Fetching all fields wastes bandwidth and exposes data",
      correction: "Use select to fetch only needed fields",
      keywords: ["prisma", "query", "performance", "security"],
      severity: "medium",
    },
  ],
  express: [
    {
      pattern: "Not setting security headers",
      reason: "Missing headers leave the app vulnerable to common attacks",
      correction: "Use helmet middleware for security headers",
      keywords: ["express", "security", "headers", "helmet"],
      severity: "high",
    },
    {
      pattern: "Using body-parser without size limits",
      reason: "Large payloads can cause denial of service",
      correction: "Set bodyParser.json({ limit: '10mb' }) or appropriate limit",
      keywords: ["express", "security", "dos", "body-parser"],
      severity: "medium",
    },
  ],
  react: [
    {
      pattern: "Using index as key in lists",
      reason: "Index keys cause rendering bugs when list items change order",
      correction: "Use stable, unique IDs as keys",
      keywords: ["react", "key", "list", "rendering"],
      severity: "medium",
    },
    {
      pattern: "Storing derived state in useState",
      reason: "Derived state leads to sync bugs and unnecessary re-renders",
      correction: "Compute derived values during render with useMemo",
      keywords: ["react", "state", "useMemo", "performance"],
      severity: "low",
    },
  ],
  typescript: [
    {
      pattern: "Using 'as' type assertion instead of type guards",
      reason: "Type assertions bypass type checking and can hide bugs",
      correction: "Use type guards or runtime validation instead",
      keywords: ["typescript", "types", "assertion", "guard"],
      severity: "medium",
    },
  ],
};

export function seedMemory(projectRoot: string, profile: ProjectProfile): number {
  const db = getDb(projectRoot);
  const now = new Date().toISOString();
  const today = now.split("T")[0]!;

  const insert = db.prepare(`
    INSERT INTO corrections (date, project, pattern, reason, correction, keywords, severity, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const stackKeys = [
    profile.language,
    profile.framework,
    profile.orm,
  ].filter((k): k is string => k !== undefined);

  for (const key of stackKeys) {
    const seeds = SEED_CORRECTIONS[key];
    if (!seeds) continue;

    for (const seed of seeds) {
      insert.run(
        today,
        null,
        seed.pattern,
        seed.reason,
        seed.correction,
        JSON.stringify(seed.keywords),
        seed.severity,
        now,
      );
      count++;
    }
  }

  return count;
}
