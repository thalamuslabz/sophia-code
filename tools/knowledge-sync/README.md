# 🧠 Open WebUI Knowledge Base Sync

Automatically sync your Obsidian-based product documentation to Open WebUI knowledge bases. Maintains separate knowledge collections for **Production** (locked source-of-truth) and **Development** (working/iterative) states.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Configuration](#configuration)
- [Usage](#usage)
- [Adding New Products](#adding-new-products)
- [Automation](#automation)
- [Troubleshooting](#troubleshooting)

## Overview

This tool bridges your Obsidian vault documentation with Open WebUI's RAG (Retrieval Augmented Generation) system. For each product/project, it creates and maintains:

| Knowledge Base | Source | Purpose |
|----------------|--------|---------|
| `{Product} - Production` | `docs/master-production/` | Locked, approved documentation - the source of truth |
| `{Product} - Development` | `docs/master-development/` | Working docs, iterative changes, drafts |

### Features

- ✅ **Two-way sync** - Production and development states
- ✅ **Incremental updates** - Only syncs changed files
- ✅ **Watch mode** - Auto-sync on file changes
- ✅ **YAML configuration** - Easy to add new products
- ✅ **Exclusion patterns** - Skip irrelevant files
- ✅ **Idempotent** - Safe to run multiple times

## Quick Start

### 1. Get Your Open WebUI API Key

1. Open Open WebUI (http://localhost:3115)
2. Go to **Settings** → **Account**
3. Click **API Key** and copy it

### 2. Set Environment Variable

```bash
export OPEN_WEBUI_API_KEY="your-api-key-here"
```

Add this to your `~/.zshrc` or `~/.bash_profile` to make it permanent.

### 3. Run Initial Sync

```bash
cd /Users/sesloan/sophia-code/tools/knowledge-sync

# List existing knowledge bases
./kb-sync list

# Sync all configured products
./kb-sync sync

# Or sync only SYNAPTICA
./kb-sync sync -p SYNAPTICA
```

## Directory Structure

Your documentation follows this pattern:

```
~/repos/thalamus-ai/
├── SYNAPTICA/
│   └── docs/
│       ├── master-production/     # ⬅️ Synced to "SYNAPTICA - Production" KB
│       │   ├── 00-command-center/
│       │   ├── 01-strategy/
│       │   ├── 02-product/
│       │   └── ...
│       └── master-development/    # ⬅️ Synced to "SYNAPTICA - Development" KB
│           ├── 00-command-center/
│           ├── 01-strategy/
│           └── ...
├── ASO/
│   └── docs/
│       ├── master-production/
│       └── master-development/
└── ...

~/Documents/Obsidian Vault/Thalamus/
├── 02-PRODUCTS/                   # ⬅️ Production docs synced here
│   └── SYNAPTICA/
│       └── master/
├── 06-PROJECTS/                   # ⬅️ Development docs synced here
│   └── SYNAPTICA/
│       └── master/
```

## Configuration

The `products.yaml` file defines what to sync:

```yaml
products:
  - name: SYNAPTICA
    production_path: /Users/sesloan/repos/thalamus-ai/SYNAPTICA/docs/master-production
    development_path: /Users/sesloan/repos/thalamus-ai/SYNAPTICA/docs/master-development
    obsidian_prod_path: /Users/sesloan/Documents/Obsidian Vault/Thalamus/02-PRODUCTS/SYNAPTICA/master
    obsidian_dev_path: /Users/sesloan/Documents/Obsidian Vault/Thalamus/06-PROJECTS/SYNAPTICA/master
    description: "AI Product Context Manager"
    file_patterns:
      - "**/*.md"
      - "**/*.mdx"
    exclude_patterns:
      - ".git"
      - ".obsidian"
```

### Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `name` | ✅ | Product/project name |
| `production_path` | ✅ | Path to production docs |
| `development_path` | ✅ | Path to development docs |
| `obsidian_prod_path` | ❌ | Obsidian production sync path (for reference) |
| `obsidian_dev_path` | ❌ | Obsidian development sync path (for reference) |
| `description` | ❌ | Description shown in Open WebUI |
| `single_kb` | ❌ | If `true`, creates only one knowledge base (no Production/Dev split) |
| `file_patterns` | ❌ | Glob patterns for files to include (default: `**/*.md`) |
| `exclude_patterns` | ❌ | Patterns to exclude (default: `.git`, `node_modules`) |

## Usage

### Basic Commands

```bash
# List all knowledge bases
./kb-sync list

# Sync all products
./kb-sync sync

# Sync specific product
./kb-sync sync -p SYNAPTICA

# Sync only production environment
./kb-sync sync -p SYNAPTICA -e production

# Sync only development environment
./kb-sync sync -p SYNAPTICA -e development

# Watch for changes (auto-sync every 5 minutes)
./kb-sync watch

# Watch with custom interval (in seconds)
./kb-sync watch -i 600  # 10 minutes

# Clean up duplicate knowledge bases (dry run)
./kb-sync cleanup

# Actually delete duplicate knowledge bases
./kb-sync cleanup --execute
```

### Direct Python Usage

If you prefer using Python directly:

```bash
# Set API key
export OPEN_WEBUI_API_KEY="your-key"

# List knowledge bases
python3 knowledge_sync.py list

# Sync all
python3 knowledge_sync.py sync

# Sync specific product
python3 knowledge_sync.py sync --product SYNAPTICA

# Watch mode
python3 knowledge_sync.py watch --interval 300
```

### Python API

You can also use this as a library in your own scripts:

```python
from knowledge_sync import OpenWebUIClient, KnowledgeSync, KnowledgeConfig

# Initialize client
client = OpenWebUIClient(
    base_url="http://localhost:3115",
    api_key="your-api-key"
)

# Create knowledge base
result = client.create_knowledge(
    name="My Project - Production",
    description="Production documentation"
)

# Upload file
upload = client.upload_file(Path("/path/to/doc.md"))

# Add to knowledge base
client.add_file_to_knowledge(result['id'], upload['id'])
```

## Adding New Products

### Step 1: Set up Documentation Structure

In your new product repo:

```bash
mkdir -p docs/master-production
mkdir -p docs/master-development
```

### Step 2: Update `products.yaml`

Add a new entry:

```yaml
products:
  - name: YOUR_NEW_PRODUCT
    production_path: /Users/sesloan/repos/thalamus-ai/YOUR_NEW_PRODUCT/docs/master-production
    development_path: /Users/sesloan/repos/thalamus-ai/YOUR_NEW_PRODUCT/docs/master-development
    obsidian_prod_path: /Users/sesloan/Documents/Obsidian Vault/Thalamus/02-PRODUCTS/YOUR_NEW_PRODUCT/master
    obsidian_dev_path: /Users/sesloan/Documents/Obsidian Vault/Thalamus/06-PROJECTS/YOUR_NEW_PRODUCT/master
    description: "Description of your product"
```

### Step 3: Sync

```bash
./kb-sync sync -p YOUR_NEW_PRODUCT
```

### Template for New Products

There's a template in `products.yaml` - just copy and modify:

```yaml
  - name: NEW_PRODUCT
    production_path: /Users/sesloan/repos/thalamus-ai/NEW_PRODUCT/docs/master-production
    development_path: /Users/sesloan/repos/thalamus-ai/NEW_PRODUCT/docs/master-development
    obsidian_prod_path: /Users/sesloan/Documents/Obsidian Vault/Thalamus/02-PRODUCTS/NEW_PRODUCT/master
    obsidian_dev_path: /Users/sesloan/Documents/Obsidian Vault/Thalamus/06-PROJECTS/NEW_PRODUCT/master
    description: "Brief description"
    file_patterns:
      - "**/*.md"
    exclude_patterns:
      - ".git"
      - ".obsidian"
```

### Template for Company Documentation (Single Knowledge Base)

For company documentation that doesn't need separate Production/Development states:

```yaml
  - name: Company-Name
    production_path: /Users/sesloan/Documents/companies/Company Name/docs/master
    development_path: /Users/sesloan/Documents/companies/Company Name/docs/master
    obsidian_prod_path: /Users/sesloan/Documents/Obsidian Vault/company/02-PRODUCTS/Company/master
    obsidian_dev_path: /Users/sesloan/Documents/Obsidian Vault/company/02-PRODUCTS/Company/master
    description: "Company documentation"
    single_kb: true  # ← Creates only one knowledge base, not Production + Development
    file_patterns:
      - "**/*.md"
      - "**/*.txt"
    exclude_patterns:
      - ".git"
      - ".obsidian"
```

## Automation

### Cron Job (Periodic Sync)

Add to crontab for automatic syncing:

```bash
# Edit crontab
crontab -e

# Add line for every 30 minutes
*/30 * * * * cd /Users/sesloan/sophia-code/tools/knowledge-sync && ./kb-sync sync >> /var/log/kb-sync.log 2>&1
```

### macOS LaunchAgent (Auto-sync on login)

Create `~/Library/LaunchAgents/com.thalamus.kb-sync.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.thalamus.kb-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/sesloan/sophia-code/tools/knowledge-sync/kb-sync</string>
        <string>sync</string>
    </array>
    <key>StartInterval</key>
    <integer>1800</integer>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OPEN_WEBUI_API_KEY</key>
        <string>your-api-key</string>
    </dict>
</dict>
</plist>
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.thalamus.kb-sync.plist
```

### Git Hook (Sync on commit)

Add to your product repo's `.git/hooks/post-commit`:

```bash
#!/bin/bash
# Sync docs to Open WebUI after commit

REPO_NAME=$(basename $(git rev-parse --show-toplevel))
KB_SYNC="/Users/sesloan/sophia-code/tools/knowledge-sync/kb-sync"

if [ -f "$KB_SYNC" ]; then
    export OPEN_WEBUI_API_KEY="your-api-key"
    "$KB_SYNC" sync -p "$REPO_NAME" 2>/dev/null &
fi
```

Make it executable:

```bash
chmod +x .git/hooks/post-commit
```

## Troubleshooting

### "API key not set" Error

```bash
# Check if set
echo $OPEN_WEBUI_API_KEY

# Set it
export OPEN_WEBUI_API_KEY="your-key"

# Make permanent
echo 'export OPEN_WEBUI_API_KEY="your-key"' >> ~/.zshrc
```

### "Connection refused" Error

Make sure Open WebUI is running:

```bash
docker ps | grep openwebui

# If not running
cd /Users/sesloan/sophia-code && docker-compose up -d openwebui
```

### Files Not Syncing

1. Check file patterns in config
2. Verify paths exist:
   ```bash
   ls -la /Users/sesloan/repos/thalamus-ai/SYNAPTICA/docs/master-production/
   ```
3. Check exclude patterns aren't matching your files

### Large File Uploads Failing

Open WebUI has file size limits. For large documentation:

1. Split into smaller markdown files
2. Use symlinks for shared content
3. Increase Open WebUI's upload limit (if self-hosted)

### Sync State Issues

If you need to force a full re-sync:

```bash
# Remove sync state
rm ~/.knowledge_sync_state.json

# Run sync again
./kb-sync sync
```

### Duplicate Knowledge Bases (Company Docs)

If you previously had company documentation creating both "Production" and "Development" knowledge bases and want to clean them up after setting `single_kb: true`:

```bash
# Preview what would be deleted (dry run)
./kb-sync cleanup

# Actually delete the duplicates
./kb-sync cleanup --execute

# Then sync to create the single consolidated knowledge base
./kb-sync sync
```

## Development

### Requirements

- Python 3.8+
- `requests` library
- `pyyaml` library

Install dependencies:

```bash
pip install requests pyyaml
```

### Testing

```bash
# Test configuration parsing
python3 -c "import knowledge_sync; k = knowledge_sync.KnowledgeSync(None, 'products.yaml'); print(k.configs)"
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Workflow                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Git Repo                    Obsidian Vault                 │
│  ┌─────────────────┐        ┌─────────────────┐             │
│  │ master-production│───────▶│ 02-PRODUCTS/    │             │
│  │ (locked source)  │  Sync  │ master/         │             │
│  └─────────────────┘        └─────────────────┘             │
│           │                           │                      │
│           │                           │                      │
│           ▼                           ▼                      │
│  ┌─────────────────────────────────────────┐                 │
│  │      Knowledge Sync Tool               │                 │
│  │  ┌─────────┐    ┌──────────────┐       │                 │
│  │  │ Scan    │───▶│ Compare Hash │       │                 │
│  │  │ Files   │    │ (incremental)│       │                 │
│  │  └─────────┘    └──────────────┘       │                 │
│  │         │              │               │                 │
│  │         ▼              ▼               │                 │
│  │  ┌──────────────────────────────┐     │                 │
│  │  │  Upload to Open WebUI        │     │                 │
│  │  │  ┌────────────────────────┐  │     │                 │
│  │  │  │ POST /api/v1/files/    │  │     │                 │
│  │  │  │ POST /api/v1/knowledge/│  │     │                 │
│  │  │  └────────────────────────┘  │     │                 │
│  │  └──────────────────────────────┘     │                 │
│  └─────────────────────────────────────────┘                 │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────────┐                 │
│  │      Open WebUI                         │                 │
│  │  ┌──────────────────────────────┐      │                 │
│  │  │  Knowledge Bases             │      │                 │
│  │  │  • SYNAPTICA - Production    │      │                 │
│  │  │  • SYNAPTICA - Development   │      │                 │
│  │  │  • ASO - Production          │      │                 │
│  │  │  • ASO - Development         │      │                 │
│  │  └──────────────────────────────┘      │                 │
│  └─────────────────────────────────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## License

MIT License - Part of the Thalamus AI ecosystem.
