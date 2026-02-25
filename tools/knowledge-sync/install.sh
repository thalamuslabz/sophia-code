#!/bin/bash
#
# Install kb-sync globally

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="/usr/local/bin"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📦 Installing kb-sync...${NC}"

# Check if running with sudo for /usr/local/bin
if [ ! -w "$BIN_DIR" ]; then
    echo -e "${YELLOW}⚠️  Need sudo access to install to $BIN_DIR${NC}"
    SUDO="sudo"
else
    SUDO=""
fi

# Create symlink
$SUDO ln -sf "$SCRIPT_DIR/kb-sync" "$BIN_DIR/kb-sync"
echo -e "${GREEN}✓ Created symlink: $BIN_DIR/kb-sync${NC}"

# Install Python dependencies
echo ""
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
pip3 install -q -r "$SCRIPT_DIR/requirements.txt"
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check for API key
echo ""
if [ -z "$OPEN_WEBUI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OPEN_WEBUI_API_KEY not set${NC}"
    echo ""
    echo "To complete setup:"
    echo "  1. Get API key from: http://localhost:3115 → Settings → Account"
    echo "  2. Add to your shell profile:"
    echo ""
    echo "     echo 'export OPEN_WEBUI_API_KEY=\"sk-your-key\"' >> ~/.zshrc"
    echo ""
    echo "  3. Reload: source ~/.zshrc"
else
    echo -e "${GREEN}✓ OPEN_WEBUI_API_KEY is set${NC}"
fi

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "Usage:"
echo "  kb-sync list              # List knowledge bases"
echo "  kb-sync sync              # Sync all products"
echo "  kb-sync sync -p SYNAPTICA # Sync specific product"
echo ""
echo "Config location: $SCRIPT_DIR/products.yaml"
