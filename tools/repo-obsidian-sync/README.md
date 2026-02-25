# 🔄 Repo-to-Obsidian Sync

Bidirectional sync tool for Git repository documentation and Obsidian Vault.

## Overview

Automatically keeps your Git repository documentation in sync with your Obsidian Vault:

```
Repo docs/                        Obsidian Vault
    │                                   │
    ▼                                   ▼
┌─────────────────┐           ┌─────────────────────────┐
│master-production│ ────────► │02-PRODUCTS/{repo}/master│
│   (*.md files)  │           │  (Production docs)      │
└─────────────────┘           └─────────────────────────┘

┌─────────────────┐           ┌─────────────────────────┐
│master-development│ ───────► │06-PROJECTS/{repo}/master│
│   (*.md files)  │           │  (Development docs)     │
└─────────────────┘           └─────────────────────────┘
```

## Monitored Sources

### Git Repositories

| Organization | Obsidian Folder | Status |
|--------------|-----------------|--------|
| `thalamus-ai` | `thalamus-ai` | ✅ Active |
| `cortex-digital` | `cortex-digital` | ✅ Active |
| `hype-local` | `hype-local` | ✅ Active |
| `thalamus-labz` | `thalamus-labz` | ✅ Active (NEW) |

### Company Documents

| Company Folder | Obsidian Target | Status |
|----------------|-----------------|--------|
| `~/Documents/companies/Thalamus/docs/master` | `thalamus-ai/02-PRODUCTS/Company/master` | ✅ Active |
| `~/Documents/companies/Cortex Digital/docs/master` | `cortex-digital/02-PRODUCTS/Company/master` | ✅ Active |
| `~/Documents/companies/Hype Local/docs/master` | `hype-local/02-PRODUCTS/Company/master` | ✅ Active |
| `~/Documents/companies/Thalamus Labz/docs/master` | `thalamus-labz/02-PRODUCTS/Company/master` | ⏳ (when created) |

## What Gets Synced

- **File Types**: `.md`, `.mdx`, `.txt`
- **Direction**: Bidirectional (newer file wins)
- **Conflict Handling**: Manual resolution required when timestamps are equal
- **Deletions**: Synced both ways (delete in repo → delete in Obsidian)

## Installation

### 1. Install the LaunchAgent (Auto-sync every 5 minutes)

```bash
# Load the launch agent
launchctl load ~/Library/LaunchAgents/com.thalamus.repo-obsidian-sync.plist

# Verify it's loaded
launchctl list | grep com.thalamus.repo-obsidian-sync
```

### 2. Manual Usage

```bash
cd /Users/sesloan/sophia-code/tools/repo-obsidian-sync

# Sync all repos
./sync-now

# Dry run (see what would sync)
./sync-now --dry-run

# Force full re-sync (repo → obsidian)
./sync-now --force

# Sync specific repo only
./sync-now --repo SYNAPTICA

# Show sync status
./sync-now --status

# Watch mode (continuous sync)
./sync-now --watch
./sync-now --watch --interval 600  # Every 10 minutes
```

## Sync Behavior

### How It Works

1. **Scan**: Scans both source (repo) and target (Obsidian) directories
2. **Compare**: Compares file hashes to detect changes
3. **Resolve**: Determines sync direction based on modification time
4. **Sync**: Copies newer files, deletes removed files
5. **Log**: Records all actions to `~/logs/repo-obsidian-sync.log`

### Conflict Resolution

When the same file is modified in both locations with the same timestamp:

```
⚠️ Conflict: filename.md (manual resolution needed)
```

Resolve manually by:
1. Opening both files
2. Merging changes
3. Saving with a new timestamp

## Folder Structure

### Repository Side

```
~/repos/
├── thalamus-ai/
│   └── docs/
│       ├── master-production/     # ➜ Obsidian 02-PRODUCTS
│       └── master-development/    # ➜ Obsidian 06-PROJECTS
├── cortex-digital/
│   └── docs/
│       ├── master-production/
│       └── master-development/
├── hype-local/
│   └── docs/
│       ├── master-production/
│       └── master-development/
└── thalamus-labz/
    └── docs/
        ├── master-production/
        └── master-development/
```

### Obsidian Side

```
Obsidian Vault/
├── thalamus-ai/
│   ├── 02-PRODUCTS/
│   │   └── thalamus-ai/master/      # ← master-production
│   └── 06-PROJECTS/
│       └── thalamus-ai/master/      # ← master-development
├── cortex-digital/
│   ├── 02-PRODUCTS/cortex-digital/master/
│   └── 06-PROJECTS/cortex-digital/master/
├── hype-local/
│   ├── 02-PRODUCTS/hype-local/master/
│   └── 06-PROJECTS/hype-local/master/
└── thalamus-labz/
    ├── 02-PRODUCTS/thalamus-labz/master/
    └── 06-PROJECTS/thalamus-labz/master/
```

## About thalamus-labz

**thalamus-labz** is the new community/open-source arm of Thalamus:

- 🌍 **Open source** - Core tools and methods shared with the community
- 🤝 **Community-driven** - Built with public contributions
- 🔬 **Experimental** - Testing ground for new ideas
- 📚 **Educational** - Documentation for learning the Thalamus method

The Obsidian vault structure mirrors `thalamus-ai` but with community-focused content:

```
thalamus-labz/
├── 01-COMPANY/
│   ├── Community/              # vs Internal strategy
│   ├── Mission-Values/         # Open source values
│   └── OSS-Licensing/          # License information
├── 02-PRODUCTS/
│   └── SYNAPTICA-CE/           # Community Edition
├── 03-TECHNICAL/
│   ├── Contributing/           # How to contribute
│   └── Community-Plugins/      # Plugin ecosystem
└── 05-OPERATIONS/
    ├── Community-Guidelines/   # Code of conduct
    └── Contributor-Onboarding/ # New contributor guides
```

## Logs

View sync activity:

```bash
# Real-time log tail
tail -f ~/logs/repo-obsidian-sync.log

# Recent errors
tail ~/logs/repo-obsidian-sync-error.log

# Full history
less ~/logs/repo-obsidian-sync.log
```

## Uninstall

```bash
# Unload the launch agent
launchctl unload ~/Library/LaunchAgents/com.thalamus.repo-obsidian-sync.plist

# Remove files
rm ~/Library/LaunchAgents/com.thalamus.repo-obsidian-sync.plist
rm -rf /Users/sesloan/sophia-code/tools/repo-obsidian-sync
rm ~/.repo_obsidian_sync_state.json
```

## Troubleshooting

### Sync not running

```bash
# Check if launch agent is loaded
launchctl list | grep com.thalamus.repo-obsidian-sync

# Load manually
launchctl load ~/Library/LaunchAgents/com.thalamus.repo-obsidian-sync.plist

# Check logs
cat ~/logs/repo-obsidian-sync-error.log
```

### Files not syncing

```bash
# Run with verbose output
./sync-now --dry-run

# Force re-sync
./sync-now --force

# Check specific repo
./sync-now --repo thalamus-labz --dry-run
```

### Conflicts

When you see "Conflict: filename.md":

1. Open both versions in Obsidian
2. Compare and merge changes
3. Save the merged file
4. Delete or archive the conflicting version
5. Run sync again

## Configuration

Edit `repo_obsidian_sync.py` to modify:

- `REPO_MAPPING`: Add new repositories
- `SYNC_PATTERNS`: Change file types to sync
- `IGNORE_PATTERNS`: Add exclusion patterns
- Sync interval in the LaunchAgent plist (default: 300 seconds)

## License

Part of the Thalamus AI internal tooling.
