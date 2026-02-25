#!/bin/bash
#
# Intelligent RAG Installation Script
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/intelligent-rag}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Intelligent RAG Installation${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check Python version
echo -e "${BLUE}[1/5]${NC} Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 is required but not installed${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "    Found Python $PYTHON_VERSION"

# Check Python version >= 3.8
REQUIRED_VERSION="3.8"
if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
    echo -e "${RED}Error: Python 3.8 or higher is required${NC}"
    exit 1
fi

# Create directories
echo -e "${BLUE}[2/5]${NC} Creating directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"
echo "    Install dir: $INSTALL_DIR"
echo "    Bin dir: $BIN_DIR"

# Copy files
echo -e "${BLUE}[3/5]${NC} Installing files..."
cp "$SCRIPT_DIR/intelligent_rag.py" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/rag-cli" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/rag-cli"
chmod +x "$INSTALL_DIR/intelligent_rag.py"
echo "    Copied intelligent_rag.py"
echo "    Copied rag-cli"

# Install Python dependencies
echo -e "${BLUE}[4/5]${NC} Installing Python dependencies..."
if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
    pip3 install --user -q -r "$SCRIPT_DIR/requirements.txt"
    echo "    Dependencies installed"
else
    echo -e "${YELLOW}    Warning: requirements.txt not found${NC}"
fi

# Create symlink in bin directory
echo -e "${BLUE}[5/5]${NC} Creating symlink..."
if [ -L "$BIN_DIR/rag-cli" ]; then
    rm "$BIN_DIR/rag-cli"
fi
ln -s "$INSTALL_DIR/rag-cli" "$BIN_DIR/rag-cli"
echo "    Created symlink: $BIN_DIR/rag-cli"

# Check if bin dir is in PATH
echo ""
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo -e "${YELLOW}Warning: $BIN_DIR is not in your PATH${NC}"
    echo "Add the following to your shell profile:"
    echo "    export PATH=\"$BIN_DIR:\$PATH\""
    echo ""
fi

# Create wrapper script for direct Python access
cat > "$BIN_DIR/intelligent-rag" << 'EOF'
#!/bin/bash
# Wrapper for intelligent_rag.py
exec python3 "$HOME/.local/intelligent-rag/intelligent_rag.py" "$@"
EOF
chmod +x "$BIN_DIR/intelligent-rag"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Usage:"
echo "    rag-cli start          # Start the server"
echo "    rag-cli classify '...' # Classify a query"
echo "    rag-cli interactive    # Interactive mode"
echo ""
echo "Or use Python directly:"
echo "    python3 $INSTALL_DIR/intelligent_rag.py --help"
echo ""
echo "To start the server now:"
echo "    rag-cli start"
echo ""
