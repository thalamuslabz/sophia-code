# 🔄 End-to-End Sync Orchestrator

Automatically discovers and syncs documentation across three systems:

```
Git Repos ──────┬──────► Obsidian Vault (bidirectional)
                │
                └──────► Open WebUI Knowledge Bases
                
Company Docs ───┬──────► Obsidian Vault (bidirectional)
                │
                └──────► Open WebUI Knowledge Bases
```

## What It Does

### 1. Discovery 🔍
- Scans `~/repos/` for projects with `docs/master-production` and `docs/master-development`
- Scans `~/Documents/companies/` for `docs/master` folders
- Detects new sources automatically

### 2. Obsidian Setup 📁
- Creates vault folder structure if missing
- Creates `02-PRODUCTS/{project}/master/` for production docs
- Creates `06-PROJECTS/{project}/master/` for development docs
- Creates `02-PRODUCTS/Company/master/` for company docs

### 3. Knowledge Base Setup 🧠
- Auto-adds new sources to `products.yaml`
- Configures Open WebUI knowledge sync
- Sets up both Production and Development collections

### 4. Sync 🔄
- Runs repo-obsidian bidirectional sync
- Runs Open WebUI knowledge base sync
- Incremental sync (only changes)

## Usage

### Discover all sources
```bash
cd /Users/sesloan/sophia-code/tools/e2e-sync
./e2e_sync.py --discover
```

### Full sync (discover + setup + sync)
```bash
./e2e_sync.py --sync
```

### Dry run (see what would happen)
```bash
./e2e_sync.py --sync --dry-run
```

### Watch mode (auto-sync every 5 min)
```bash
./e2e_sync.py --watch
```

## Workflow Example

### Adding a New Repo

1. **Create new repo with docs structure:**
```bash
mkdir -p ~/repos/thalamus-ai/NewProduct/docs/master-production
mkdir -p ~/repos/thalamus-ai/NewProduct/docs/master-development
```

2. **Add documentation:**
```bash
cp my-docs.md ~/repos/thalamus-ai/NewProduct/docs/master-production/
```

3. **Run e2e sync:**
```bash
./e2e_sync.py --sync
```

This automatically:
- ✅ Discovers `NewProduct`
- ✅ Creates `~/Documents/Obsidian Vault/thalamus-ai/02-PRODUCTS/NewProduct/master/`
- ✅ Creates `~/Documents/Obsidian Vault/thalamus-ai/06-PROJECTS/NewProduct/master/`
- ✅ Adds to `products.yaml`
- ✅ Syncs docs to Obsidian
- ✅ Creates Open WebUI knowledge bases
- ✅ Syncs docs to knowledge bases

### Adding a New Company

1. **Create company folder:**
```bash
mkdir -p "~/Documents/companies/My New Company/docs/master"
```

2. **Add docs and run sync:**
```bash
./e2e_sync.py --sync
```

## Monitored Sources

### Git Organizations
- `thalamus-ai` → Obsidian: `thalamus-ai`
- `cortex-digital` → Obsidian: `cortex-digital`
- `hype-local` → Obsidian: `hype-local`
- `thalamus-labz` → Obsidian: `thalamus-labz`

### Companies
- `~/Documents/companies/Thalamus/docs/master`
- `~/Documents/companies/Cortex Digital/docs/master`
- `~/Documents/companies/Hype Local/docs/master`
- `~/Documents/companies/Thalamus Labz/docs/master`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Sync Orchestrator                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Discovery   │───►│    Setup     │───►│     Sync     │  │
│  │              │    │              │    │              │  │
│  │ Scan repos   │    │ • Obsidian   │    │ • Repo◄─►Obs │  │
│  │ Scan company │    │ • Config     │    │ • Obs ──►KB  │  │
│  │ Detect new   │    │ • KB setup   │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                            │      │
│         ▼                                            ▼      │
│  ┌──────────────┐                           ┌────────────┐ │
│  │   Source     │                           │   Target   │ │
│  │              │                           │            │ │
│  │ ~/repos/     │                           │ Obsidian   │ │
│  │ ~/Documents/ │                           │ Open WebUI │ │
│  │   companies/ │                           │            │ │
│  └──────────────┘                           └────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Automation

Add to crontab for automatic discovery:
```bash
# Edit crontab
crontab -e

# Add line for every 10 minutes
*/10 * * * * cd /Users/sesloan/sophia-code/tools/e2e-sync && ./e2e_sync.py --sync >> /Users/sesloan/logs/e2e-sync.log 2>&1
```

Or use launchd for macOS (see `com.thalamus.e2e-sync.plist`)

## Files

- `e2e_sync.py` - Main orchestrator
- `products.yaml` - Open WebUI KB config (auto-managed)
- `repo_obsidian_sync.py` - Repo↔Obsidian sync
- `knowledge_sync.py` - Obsidian↔Open WebUI sync

## Troubleshooting

### Nothing discovered
- Check paths exist: `ls ~/repos/thalamus-ai/`
- Check docs folders exist: `ls ~/repos/thalamus-ai/*/docs/`

### Knowledge bases not created
- Check API key: `echo $OPEN_WEBUI_API_KEY`
- Test manually: `./e2e_sync.py --discover`

### Sync errors
- Check logs: `tail -f ~/logs/repo-obsidian-sync.log`
- Run individual syncs to debug
