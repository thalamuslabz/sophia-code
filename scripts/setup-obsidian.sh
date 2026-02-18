#!/bin/bash
# Obsidian Integration Setup Script
# Part of Thalamus AI installation

set -e

VAULT_DIR="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian Vault}"
EVIDENCE_DIR="${EVIDENCE_DIR:-$HOME/.auto-claude/evidence}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Setting up Obsidian Integration...${NC}"

# Detect vault directory
detect_vault() {
    local possible_paths=(
        "$HOME/Documents/Obsidian Vault"
        "$HOME/Documents/Vault"
        "$HOME/Obsidian Vault"
        "$HOME/vault"
    )
    
    for path in "${possible_paths[@]}"; do
        if [ -d "$path/.obsidian" ]; then
            echo "$path"
            return 0
        fi
    done
    
    return 1
}

# Try to detect vault
if [ -d "$VAULT_DIR/.obsidian" ]; then
    echo -e "${GREEN}✓${NC} Found vault at: $VAULT_DIR"
elif detected=$(detect_vault); then
    VAULT_DIR="$detected"
    echo -e "${GREEN}✓${NC} Found vault at: $VAULT_DIR"
else
    echo "Obsidian vault not detected at standard locations."
    echo "Please set OBSIDIAN_VAULT_PATH environment variable:"
    echo "  export OBSIDIAN_VAULT_PATH=/path/to/your/vault"
    exit 1
fi

# Create evidence directory
mkdir -p "$EVIDENCE_DIR"
echo -e "${GREEN}✓${NC} Evidence directory: $EVIDENCE_DIR"

# Initialize vault structure
echo "Initializing vault structure..."
cd packages/obsidian-sync
npm run build 2>/dev/null || npm run build
node dist/cli.js init --vault "$VAULT_DIR"

echo ""
echo -e "${GREEN}Obsidian integration ready!${NC}"
echo ""
echo "To start syncing:"
echo "  obsidian-sync start"
echo ""
echo "Your vault: $VAULT_DIR"
