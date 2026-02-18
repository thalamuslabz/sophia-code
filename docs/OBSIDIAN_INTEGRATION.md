# Obsidian Integration

**Auto-sync your AI development workflow to your knowledge base.**

---

## Overview

The Obsidian integration automatically documents your Thalamus AI builds:

- **Build Evidence** → Structured notes in your vault
- **Daily Notes** → AI work tracked alongside your day
- **Project Indices** → Auto-updated build history
- **Master Index** → Cross-project overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     OBSIDIAN VAULT STRUCTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📁 06-PROJECTS/                                                 │
│  ├── 📄 _Master Index.md          ← All projects overview       │
│  ├── 📁 SOPHIA/                                                  │
│  │   ├── 📄 _Index.md             ← Project overview            │
│  │   ├── 📁 builds/                                              │
│  │   │   ├── 📄 intent-001.md     ← Individual build notes      │
│  │   │   ├── 📄 intent-002.md                                    │
│  │   │   └── ...                                                │
│  │   ├── 📁 tasks/                                               │
│  │   └── 📁 architecture/                                        │
│  ├── 📁 SYNAPTICA/                                               │
│  └── 📁 ExecutionIQ/                                             │
│                                                                  │
│  📁 Daily Notes/                                                 │
│  ├── 📄 2024-02-17.md             ← AI builds in context        │
│  └── ...                                                        │
│                                                                  │
│  📁 _templates/                                                  │
│  ├── 📄 Daily Note.md                                            │
│  ├── 📄 Project.md                                               │
│  └── 📄 Evidence.md                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup

### Prerequisites

- [Obsidian](https://obsidian.md/) installed
- Your vault location known (usually `~/Documents/Obsidian Vault`)

### Automatic Setup

```bash
# During Thalamus AI installation
./install.sh

# Or manually initialize vault structure
obsidian-sync init
```

### Manual Configuration

If your vault is in a non-standard location:

```bash
# Set environment variable
export OBSIDIAN_VAULT_PATH="/path/to/your/vault"

# Or pass to commands
obsidian-sync start --vault /path/to/your/vault
```

---

## How It Works

### 1. Build Completion Trigger

When AI agents finish a build:

```
Build completes
     ↓
Evidence written to ~/.auto-claude/evidence/
     ↓
Obsidian Sync detects new file
     ↓
Markdown note created in vault
     ↓
Daily note updated
     ↓
Project index updated
```

### 2. Note Structure

Each build creates a note like:

```markdown
# ✅ Build: MyProject

## Metadata
- **Intent ID**: `intent-2024-02-17-001`
- **Status**: ✅ success
- **Date**: 2/17/2024, 3:45:23 PM
- **Duration**: 2.3m
- **Artifacts**: 12 files

## Artifacts
### Source Files
- `src/auth/login.ts` typescript (2.4 KB)
- `src/auth/register.ts` typescript (3.1 KB)

### Test Files
- `src/auth/login.test.ts` typescript (1.8 KB)

## Test Results
- **Status**: ✅ All Passed
- **Passed**: 15 ✅
- **Failed**: 0 ❌
- **Skipped**: 2 ⏭️
- **Duration**: 4.2s
- **Coverage**: 87%

## Links
- [[MyProject - Architecture]]
- [[MyProject - Tasks]]
- Dashboard: http://localhost:9473
- Orchestrator: http://localhost:7654/intents/intent-2024-02-17-001

---
*Synced by Thalamus AI*
```

---

## Usage

### Start Sync Daemon

```bash
# Auto-detect vault location
obsidian-sync start

# Or specify paths
obsidian-sync start \
  --vault ~/Documents/MyVault \
  --evidence ~/.auto-claude/evidence
```

The daemon runs in the background, watching for new evidence files.

### Check Status

```bash
obsidian-sync status

# Output:
# Obsidian Sync Status
# ====================
# Synced:  23
# Pending: 0
```

### Manual Sync

```bash
# Sync a specific evidence file
obsidian-sync sync ~/.auto-claude/evidence/intent-001.json
```

### Initialize Vault Structure

```bash
# Create directory structure and templates
obsidian-sync init --vault ~/Documents/Obsidian\ Vault
```

---

## n8n Integration

For advanced automation, import the n8n workflows:

```bash
# Open n8n at http://localhost:3118
# Go to Workflows → Import
# Select: apps/n8n-workflows/obsidian-sync.json
```

This enables:
- Custom transformations
- Notifications
- Conditional logic
- Multi-vault support

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OBSIDIAN_VAULT_PATH` | Path to your vault | `~/Documents/Obsidian Vault` |
| `OBSIDIAN_PROJECTS_DIR` | Projects subdirectory | `06-PROJECTS` |
| `OBSIDIAN_DAILY_DIR` | Daily notes subdirectory | `Daily Notes` |
| `OBSIDIAN_TEMPLATES_DIR` | Templates subdirectory | `_templates` |
| `EVIDENCE_DIR` | Evidence source directory | `~/.auto-claude/evidence` |

### .env File

Create `.env` in your project root:

```bash
OBSIDIAN_VAULT_PATH=/Users/me/Documents/Obsidian Vault
OBSIDIAN_PROJECTS_DIR=06-PROJECTS
EVIDENCE_DIR=/Users/me/.auto-claude/evidence
```

---

## Templates

### Customize Note Templates

Edit files in your vault's `_templates/` directory:

**Evidence.md:**
```markdown
# {{title}}

## Metadata
- **Intent ID**: {{intent_id}}
- **Project**: {{project}}

## My Custom Section
Add your own tracking fields here

## Artifacts
{{artifacts}}

---
Synced: {{timestamp}}
```

### Available Variables

| Variable | Description |
|----------|-------------|
| `{{intent_id}}` | Unique build identifier |
| `{{project}}` | Project name |
| `{{status}}` | Build status (success/failure/partial) |
| `{{timestamp}}` | Build completion time |
| `{{duration}}` | Build duration |
| `{{artifacts}}` | List of artifacts |
| `{{test_results}}` | Test summary |
| `{{git_commit}}` | Git commit hash |

---

## Troubleshooting

### "Vault not found"

```bash
# Check vault path
ls -la ~/Documents/Obsidian\ Vault/.obsidian

# Set explicit path
export OBSIDIAN_VAULT_PATH=/path/to/vault
```

### "Notes not appearing"

1. Check sync is running:
   ```bash
   obsidian-sync status
   ```

2. Verify evidence directory:
   ```bash
   ls -la ~/.auto-claude/evidence/
   ```

3. Check vault write permissions

### "Wrong project code"

Edit the project code mapping in `packages/obsidian-sync/src/core/evidence-sync.ts`:

```typescript
private inferProjectCode(project: string): string {
  const codeMap: Record<string, string> = {
    'my-project': 'MYPROJ',  // Add your mapping
    // ...
  };
  // ...
}
```

---

## Best Practices

### 1. Use Wikilinks

Thalamus creates Obsidian-style wikilinks:
- `[[intent-001]]` links to build notes
- `[[Project - Architecture]]` links to architecture docs

### 2. Tag Builds

Add custom tags to generated notes:

```markdown
# Build Note
#build #ai-generated #{{project}}

...
```

### 3. Create Dashboard

Make a dashboard note:

```markdown
# AI Development Dashboard

## Recent Builds
```dataview
TABLE status, date
FROM "06-PROJECTS"
SORT date DESC
LIMIT 10
```

## By Project
```dataview
TABLE length(rows) as "Builds"
FROM "06-PROJECTS"
GROUP BY project
```
```

### 4. Sync to Git

Version your vault:

```bash
cd ~/Documents/Obsidian\ Vault
git init
git add .
git commit -m "Vault backup"
```

---

## Integration with Other Tools

### Leantime

Build completion updates tickets via n8n:

```
Build completes
  → Evidence created
  → Obsidian note created
  → Leantime ticket updated
```

### GitHub

Git commits referenced in build notes:

```markdown
## Git Commit
`abc1234`

[View on GitHub](https://github.com/user/repo/commit/abc1234)
```

### Screen Recordings

Link recordings in evidence:

```markdown
## Recordings
- [Login test](./recordings/login-test.mp4)
- [Full session](./recordings/session.mp4)
```

---

## Privacy & Security

- **Local-first**: All data stays in your vault
- **No cloud required**: Sync works offline
- **Git-compatible**: Version your documentation
- **Encrypted**: Works with Obsidian encryption

---

## Advanced: Custom Plugins

Build your own Obsidian plugin using the sync API:

```typescript
import { EvidenceSync } from '@thalamus/obsidian-sync';

const sync = new EvidenceSync({
  vaultDir: '/path/to/vault',
  evidenceDir: '/path/to/evidence'
});

// Custom processing
sync.on('evidence', (evidence) => {
  // Your custom logic
});

await sync.start();
```

---

**Your AI development, automatically documented.** 📚
