import type { TeachingMoment, ExperienceLevel } from "@sophia-code/shared";

export function formatTeachingForCLI(
  moment: TeachingMoment,
  level: ExperienceLevel,
): string {
  if (level === "advanced") {
    const icon =
      moment.severity === "red" ? "RED" :
      moment.severity === "yellow" ? "YEL" : "GRN";
    return `${icon} ${moment.headline}`;
  }

  const lines: string[] = [];
  lines.push(moment.headline);
  lines.push("");
  lines.push(moment.explanation);

  if (moment.fixSuggestion) {
    lines.push("");
    lines.push(`Fix: ${moment.fixSuggestion}`);
  }

  lines.push("");
  lines.push(moment.ruleReference);
  if (moment.learnMore) {
    lines.push(moment.learnMore);
  }

  return lines.join("\n");
}

export function relativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
