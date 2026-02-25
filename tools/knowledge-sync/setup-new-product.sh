#!/bin/bash
#
# Setup New Product for Knowledge Base Sync
# 
# Usage:
#   ./setup-new-product.sh PRODUCT_NAME
#
# Example:
#   ./setup-new-product.sh ASO

set -e

PRODUCT_NAME="${1:-}"

if [ -z "$PRODUCT_NAME" ]; then
    echo "❌ Error: Product name required"
    echo "Usage: $0 PRODUCT_NAME"
    echo "Example: $0 ASO"
    exit 1
fi

REPO_BASE="/Users/sesloan/repos/thalamus-ai"
OBSIDIAN_PROD="/Users/sesloan/Documents/Obsidian Vault/Thalamus/02-PRODUCTS"
OBSIDIAN_DEV="/Users/sesloan/Documents/Obsidian Vault/Thalamus/06-PROJECTS"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Setting up knowledge base sync for: $PRODUCT_NAME${NC}"
echo ""

# Step 1: Check if repo exists
REPO_PATH="$REPO_BASE/$PRODUCT_NAME"
if [ ! -d "$REPO_PATH" ]; then
    echo -e "${YELLOW}⚠️  Repo not found at: $REPO_PATH${NC}"
    echo "   Please clone/create the repo first:"
    echo "   mkdir -p $REPO_PATH && cd $REPO_PATH && git init"
    exit 1
fi

# Step 2: Create documentation structure
echo -e "${GREEN}📁 Creating documentation structure...${NC}"
mkdir -p "$REPO_PATH/docs/master-production"
mkdir -p "$REPO_PATH/docs/master-development"

# Create README templates
cat > "$REPO_PATH/docs/master-production/README.md" << EOF
# $PRODUCT_NAME - Production Documentation

This is the locked, approved production documentation for $PRODUCT_NAME.

## Structure

- \`00-command-center/\` - Quick reference and navigation
- \`01-strategy/\` - Strategic documents, vision, OKRs
- \`02-product/\` - Product specifications and requirements
- \`03-architecture/\` - Technical architecture and design
- \`04-validation/\` - Testing, QA, and validation docs
- \`05-operations/\` - Runbooks, deployment guides
- \`06-content/\` - User-facing content and documentation
- \`07-reference/\` - API docs, glossaries, etc.

## Status

- **Last Updated**: $(date +%Y-%m-%d)
- **Version**: 1.0.0
- **Status**: Production Ready
EOF

cat > "$REPO_PATH/docs/master-development/README.md" << EOF
# $PRODUCT_NAME - Development Documentation

This is the working/iterative documentation for $PRODUCT_NAME.

## Purpose

Use this space for:
- Draft documents under review
- Experimental features
- Iterative improvements
- WIP architecture decisions

## Sync with Production

When documents here are finalized, they should be promoted to \`master-production/\`.

## Status

- **Last Updated**: $(date +%Y-%m-%d)
- **Status**: Work in Progress
EOF

echo "   ✓ Created master-production/README.md"
echo "   ✓ Created master-development/README.md"

# Step 3: Create Obsidian vault folders
echo ""
echo -e "${GREEN}📁 Creating Obsidian vault folders...${NC}"
mkdir -p "$OBSIDIAN_PROD/$PRODUCT_NAME/master"
mkdir -p "$OBSIDIAN_DEV/$PRODUCT_NAME/master"

# Create placeholder files for sync
touch "$OBSIDIAN_PROD/$PRODUCT_NAME/master/.gitkeep"
touch "$OBSIDIAN_DEV/$PRODUCT_NAME/master/.gitkeep"

echo "   ✓ Created: $OBSIDIAN_PROD/$PRODUCT_NAME/master"
echo "   ✓ Created: $OBSIDIAN_DEV/$PRODUCT_NAME/master"

# Step 4: Update products.yaml
echo ""
echo -e "${GREEN}📝 Updating products.yaml...${NC}"

# Check if already exists
if grep -q "name: $PRODUCT_NAME" "$SCRIPT_DIR/products.yaml" 2>/dev/null; then
    echo -e "${YELLOW}   ⚠️  $PRODUCT_NAME already exists in products.yaml${NC}"
else
    # Append to products.yaml
    cat >> "$SCRIPT_DIR/products.yaml" << EOF

  # ========================================
  # $PRODUCT_NAME
  # ========================================
  - name: $PRODUCT_NAME
    production_path: $REPO_PATH/docs/master-production
    development_path: $REPO_PATH/docs/master-development
    obsidian_prod_path: $OBSIDIAN_PROD/$PRODUCT_NAME/master
    obsidian_dev_path: $OBSIDIAN_DEV/$PRODUCT_NAME/master
    description: "$PRODUCT_NAME product documentation"
    file_patterns:
      - "**/*.md"
      - "**/*.mdx"
    exclude_patterns:
      - ".git"
      - "node_modules"
      - "__pycache__"
      - ".obsidian"
EOF
    echo "   ✓ Added to products.yaml"
fi

# Step 5: Display summary
echo ""
echo -e "${BLUE}✅ Setup complete for: $PRODUCT_NAME${NC}"
echo ""
echo "📂 Directory Structure:"
echo "   Repo:     $REPO_PATH/docs/"
echo "             ├── master-production/  →  Open WebUI: \"$PRODUCT_NAME - Production\""
echo "             └── master-development/ →  Open WebUI: \"$PRODUCT_NAME - Development\""
echo ""
echo "   Obsidian: $OBSIDIAN_PROD/$PRODUCT_NAME/master"
echo "             └── (synced from master-production)"
echo "   Obsidian: $OBSIDIAN_DEV/$PRODUCT_NAME/master"
echo "             └── (synced from master-development)"
echo ""
echo "🚀 Next steps:"
echo "   1. Add documentation to $REPO_PATH/docs/master-production/"
echo "   2. Run: ./kb-sync sync -p $PRODUCT_NAME"
echo ""
echo "📖 For more info: cat README.md"
