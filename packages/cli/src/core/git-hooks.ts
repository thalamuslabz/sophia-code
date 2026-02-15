import fs from "node:fs";
import path from "node:path";

const PRE_COMMIT_HOOK = `#!/bin/bash
# Sophia governance pre-commit hook
# Installed by: sophia init

# Check for policy violations on staged files
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Run sophia policy check on staged files if sophia is available
if command -v sophia &> /dev/null; then
  # Read strictness from config
  STRICTNESS="moderate"
  if [ -f ".sophia/config.yaml" ]; then
    DETECTED=$(grep 'strictness:' .sophia/config.yaml 2>/dev/null | head -1 | awk '{print $2}' | tr -d '"'"'"')
    if [ -n "$DETECTED" ]; then
      STRICTNESS="$DETECTED"
    fi
  fi

  # In strict mode, require an active session
  if [ "$STRICTNESS" = "strict" ]; then
    SESSION_COUNT=$(sophia session list --count 2>/dev/null || echo "0")
    if [ "$SESSION_COUNT" = "0" ]; then
      echo ""
      echo "Sophia [STRICT]: No active session found."
      echo "  Start a session before committing: sophia session start --intent \\"your intent\\""
      exit 1
    fi

    # Check claims on staged files
    for FILE in $STAGED_FILES; do
      CLAIM_RESULT=$(sophia session check "$FILE" --quiet 2>/dev/null || echo "ok")
      if [ "$CLAIM_RESULT" = "conflict" ]; then
        echo ""
        echo "Sophia [STRICT]: File $FILE is claimed by another session."
        echo "  Release the claim or coordinate with the other agent."
        exit 1
      fi
    done
  fi

  # Run policy check (handles pattern, git-hook, heuristic detection types)
  sophia policy check --staged --quiet
  RESULT=$?

  if [ $RESULT -eq 1 ]; then
    echo ""
    if [ "$STRICTNESS" = "permissive" ]; then
      echo "Sophia [WARN]: Policy violations found in staged files (permissive mode — allowing commit)."
    else
      echo "Sophia: Policy violations found in staged files."
      echo "Fix the issues above or use --no-verify to skip."
      exit 1
    fi
  fi

  # Run health score if configured
  SCORE_ON_COMMIT=$(grep 'score_on_commit:' .sophia/config.yaml 2>/dev/null | head -1 | awk '{print $2}' | tr -d '"'"'"')
  if [ "$SCORE_ON_COMMIT" = "true" ]; then
    sophia verify --quiet 2>/dev/null
  fi
fi

exit 0
`;

export function installGitHooks(projectRoot: string): void {
  const hooksDir = path.join(projectRoot, ".git", "hooks");
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const hookPath = path.join(hooksDir, "pre-commit");

  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf-8");
    if (existing.includes("sophia")) {
      // Replace existing sophia hook with updated version
      fs.writeFileSync(hookPath, PRE_COMMIT_HOOK, { mode: 0o755 });
      return;
    }
    // Append to existing hook
    fs.appendFileSync(hookPath, "\n" + PRE_COMMIT_HOOK);
  } else {
    fs.writeFileSync(hookPath, PRE_COMMIT_HOOK, { mode: 0o755 });
  }
}
