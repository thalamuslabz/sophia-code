# 🚀 Knowledge Base Sync - Quick Start Guide

## 1-Minute Setup

### Step 1: Get API Key
1. Open http://localhost:3115
2. Settings → Account → API Key → Copy

### Step 2: Set API Key
```bash
export OPEN_WEBUI_API_KEY="sk-..."
echo 'export OPEN_WEBUI_API_KEY="sk-..."' >> ~/.zshrc
```

### Step 3: Install Dependencies
```bash
cd /Users/sesloan/sophia-code/tools/knowledge-sync
pip install -r requirements.txt
```

### Step 4: Test Sync
```bash
# See what knowledge bases exist
./kb-sync list

# Sync SYNAPTICA to Open WebUI
./kb-sync sync -p SYNAPTICA
```

---

## Common Commands

```bash
# Sync all products
./kb-sync sync

# Sync specific product
./kb-sync sync -p SYNAPTICA

# Sync only production
./kb-sync sync -p SYNAPTICA -e production

# Auto-sync every 5 minutes
./kb-sync watch

# Add new product
./setup-new-product.sh PRODUCT_NAME
```

---

## Add New Product (30 seconds)

```bash
# Run setup script
./setup-new-product.sh MY_NEW_PRODUCT

# Add docs to the repo
cp my-docs.md ~/repos/thalamus-ai/MY_NEW_PRODUCT/docs/master-production/

# Sync to Open WebUI
./kb-sync sync -p MY_NEW_PRODUCT
```

Done! You'll now see:
- "MY_NEW_PRODUCT - Production" in Open WebUI
- "MY_NEW_PRODUCT - Development" in Open WebUI

---

## File Structure

```
Your Repo                    Obsidian                      Open WebUI
    │                           │                              │
    ▼                           ▼                              ▼
┌──────────────┐        ┌──────────────┐              ┌──────────────┐
│master-prod/  │───────▶│02-PRODUCTS/  │─────────────▶│ Production   │
│              │  Sync  │              │   kb-sync    │ Knowledge    │
│  *.md files  │        │  *.md files  │              │   Base       │
└──────────────┘        └──────────────┘              └──────────────┘

┌──────────────┐        ┌──────────────┐              ┌──────────────┐
│master-dev/   │───────▶│06-PROJECTS/  │─────────────▶│ Development  │
│              │  Sync  │              │   kb-sync    │ Knowledge    │
│  *.md files  │        │  *.md files  │              │   Base       │
└──────────────┘        └──────────────┘              └──────────────┘
```

---

## Using in Open WebUI

After syncing, when you start a chat:

1. Click **+** next to the input box
2. Select **Knowledge** 
3. Choose:
   - `SYNAPTICA - Production` for stable/approved docs
   - `SYNAPTICA - Development` for latest/working docs
4. Ask questions about your documentation!

Example prompts:
- "What is the system architecture?"
- "Summarize the API endpoints"
- "What are the deployment steps?"
- "Find documentation about authentication"

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not set" | `export OPEN_WEBUI_API_KEY="..."` |
| "Connection refused" | Make sure Open WebUI is running: `docker ps \| grep openwebui` |
| Files not syncing | Check paths in `products.yaml` |
| Large files fail | Split into smaller markdown files |

---

## For More Info

See [README.md](README.md) for full documentation.
