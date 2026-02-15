import fs from "node:fs";
import path from "node:path";

export function loadSophiaIgnore(projectRoot: string): string[] {
  const ignorePath = path.join(projectRoot, ".sophiaignore");

  if (!fs.existsSync(ignorePath)) return [];

  const content = fs.readFileSync(ignorePath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export function isAgentIgnored(
  agentName: string,
  ignoreList: string[],
): boolean {
  return ignoreList.some(
    (entry) =>
      entry === agentName ||
      entry === `agent:${agentName}`,
  );
}
