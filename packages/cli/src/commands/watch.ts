import { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { configExists } from "../core/config.js";
import { getDb, initDb } from "../core/database.js";
import { postBulletin } from "../core/bulletin.js";

export const watchCommand = new Command("watch")
  .description("Watch project for file changes and log activity to the dashboard")
  .option("--interval <ms>", "Poll interval in milliseconds", "3000")
  .action((options: { interval?: string }) => {
    const projectRoot = process.cwd();

    if (!configExists(projectRoot)) {
      console.log(chalk.red("sophia: error: .sophia/ directory not found"));
      console.log('  Run "sophia init" to set up Sophia in this project.');
      process.exit(1);
    }

    // Ensure DB is initialized
    initDb(projectRoot);

    const interval = parseInt(options.interval ?? "3000", 10);
    let lastCommitHash = getLatestCommitHash(projectRoot);
    let lastFileSnapshot = takeFileSnapshot(projectRoot);
    let sessionId: string | null = null;

    console.log(chalk.bold("Sophia Watch"));
    console.log(chalk.dim(`  Monitoring: ${projectRoot}`));
    console.log(chalk.dim(`  Interval:  ${interval}ms`));
    console.log(chalk.dim("  Press Ctrl+C to stop"));
    console.log();

    // Auto-start a watch session
    sessionId = startWatchSession(projectRoot);
    postBulletin(projectRoot, {
      sessionId,
      agent: "sophia-watch",
      type: "session_start",
      message: "File watcher started — monitoring project activity",
    });
    console.log(chalk.green("Watching for changes..."));

    const timer = setInterval(() => {
      try {
        checkForChanges(projectRoot, sessionId!);
      } catch {
        // Silently continue on errors
      }
    }, interval);

    const cleanup = (): void => {
      clearInterval(timer);
      if (sessionId) {
        endWatchSession(projectRoot, sessionId);
        postBulletin(projectRoot, {
          sessionId,
          agent: "sophia-watch",
          type: "session_end",
          message: "File watcher stopped",
        });
      }
      console.log(chalk.dim("\nWatch stopped."));
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    function checkForChanges(root: string, sid: string): void {
      // Check for new commits
      const currentHash = getLatestCommitHash(root);
      if (currentHash && currentHash !== lastCommitHash) {
        const commitMsg = getCommitMessage(root, currentHash);
        const filesChanged = getCommitFiles(root, currentHash);
        postBulletin(root, {
          sessionId: sid,
          agent: "git",
          type: "commit",
          message: `New commit: ${commitMsg}`,
          files: filesChanged,
        });
        console.log(chalk.blue(`  commit: ${commitMsg}`));
        lastCommitHash = currentHash;
        touchSession(root, sid);
      }

      // Check for file changes (modified/created/deleted)
      const currentSnapshot = takeFileSnapshot(root);
      const changes = diffSnapshots(lastFileSnapshot, currentSnapshot);

      if (changes.created.length > 0) {
        postBulletin(root, {
          sessionId: sid,
          agent: "filesystem",
          type: "new_file",
          message: `${changes.created.length} file(s) created`,
          files: changes.created.slice(0, 10),
        });
        console.log(chalk.green(`  +${changes.created.length} created: ${changes.created.slice(0, 3).join(", ")}${changes.created.length > 3 ? "..." : ""}`));
        touchSession(root, sid);
      }

      if (changes.modified.length > 0) {
        postBulletin(root, {
          sessionId: sid,
          agent: "filesystem",
          type: "file_change",
          message: `${changes.modified.length} file(s) modified`,
          files: changes.modified.slice(0, 10),
        });
        console.log(chalk.yellow(`  ~${changes.modified.length} modified: ${changes.modified.slice(0, 3).join(", ")}${changes.modified.length > 3 ? "..." : ""}`));
        touchSession(root, sid);
      }

      if (changes.deleted.length > 0) {
        postBulletin(root, {
          sessionId: sid,
          agent: "filesystem",
          type: "file_change",
          message: `${changes.deleted.length} file(s) deleted`,
          files: changes.deleted.slice(0, 10),
        });
        console.log(chalk.red(`  -${changes.deleted.length} deleted: ${changes.deleted.slice(0, 3).join(", ")}${changes.deleted.length > 3 ? "..." : ""}`));
        touchSession(root, sid);
      }

      lastFileSnapshot = currentSnapshot;
    }
  });

function getLatestCommitHash(root: string): string | null {
  try {
    return execSync("git rev-parse HEAD", { cwd: root, encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function getCommitMessage(root: string, hash: string): string {
  try {
    return execSync(`git log -1 --pretty=%s ${hash}`, { cwd: root, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function getCommitFiles(root: string, hash: string): string[] {
  try {
    const output = execSync(`git diff-tree --no-commit-id --name-only -r ${hash}`, {
      cwd: root,
      encoding: "utf-8",
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

type FileSnapshot = Map<string, number>; // relativePath -> mtime

function takeFileSnapshot(root: string): FileSnapshot {
  const snapshot: FileSnapshot = new Map();
  const ignore = new Set(["node_modules", ".git", ".sophia", "dist", "build", ".next", "coverage", ".DS_Store"]);

  function walk(dir: string, prefix: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (ignore.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          snapshot.set(relPath, stat.mtimeMs);
        } catch {
          // skip files we can't stat
        }
      }
    }
  }

  walk(root, "");
  return snapshot;
}

interface SnapshotDiff {
  created: string[];
  modified: string[];
  deleted: string[];
}

function diffSnapshots(prev: FileSnapshot, curr: FileSnapshot): SnapshotDiff {
  const created: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];

  for (const [file, mtime] of curr) {
    const prevMtime = prev.get(file);
    if (prevMtime === undefined) {
      created.push(file);
    } else if (prevMtime !== mtime) {
      modified.push(file);
    }
  }

  for (const file of prev.keys()) {
    if (!curr.has(file)) {
      deleted.push(file);
    }
  }

  return { created, modified, deleted };
}

function startWatchSession(root: string): string {
  const db = getDb(root);
  const id = `watch-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO sessions (id, agent, pid, intent, status, started_at, last_activity_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, "sophia-watch", process.pid, "File watcher", "active", now, now);
  return id;
}

function touchSession(root: string, sessionId: string): void {
  const db = getDb(root);
  db.prepare("UPDATE sessions SET last_activity_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    sessionId,
  );
}

function endWatchSession(root: string, sessionId: string): void {
  const db = getDb(root);
  const now = new Date().toISOString();
  db.prepare("UPDATE sessions SET status = 'ended', ended_at = ?, last_activity_at = ? WHERE id = ?").run(
    now,
    now,
    sessionId,
  );
}
