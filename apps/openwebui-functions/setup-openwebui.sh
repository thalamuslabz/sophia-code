#!/bin/bash
#
# Open WebUI Intelligent RAG Setup Script
#
# This script configures Open WebUI to use the Intelligent RAG system
# with x-ai/grok-4.1-fast for high-accuracy query classification.
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPEN_WEBUI_FUNCTIONS_DIR="${OPEN_WEBUI_FUNCTIONS_DIR:-}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Open WebUI + Intelligent RAG Setup                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detect Open WebUI installation
detect_openwebui() {
    echo -e "${BLUE}[1/5]${NC} Detecting Open WebUI installation..."
    
    # Common locations to check
    locations=(
        "$HOME/open-webui"
        "$HOME/Open-WebUI"
        "/opt/open-webui"
        "/usr/local/open-webui"
        "/app"  # Docker default
        "$HOME/.local/share/open-webui"
    )
    
    for loc in "${locations[@]}"; do
        if [ -d "$loc" ] && [ -d "$loc/backend" ]; then
            echo "    Found: $loc"
            OPEN_WEBUI_DIR="$loc"
            
            # Check for functions directory
            if [ -d "$loc/backend/functions" ]; then
                OPEN_WEBUI_FUNCTIONS_DIR="$loc/backend/functions"
                echo "    Functions dir: $OPEN_WEBUI_FUNCTIONS_DIR"
                return 0
            elif [ -d "$loc/functions" ]; then
                OPEN_WEBUI_FUNCTIONS_DIR="$loc/functions"
                echo "    Functions dir: $OPEN_WEBUI_FUNCTIONS_DIR"
                return 0
            fi
        fi
    done
    
    # Check if running in Docker
    if [ -f "/.dockerenv" ] || [ -d "/app/backend" ]; then
        if [ -d "/app/backend/functions" ]; then
            OPEN_WEBUI_FUNCTIONS_DIR="/app/backend/functions"
            echo "    Detected Docker environment"
            echo "    Functions dir: $OPEN_WEBUI_FUNCTIONS_DIR"
            return 0
        fi
    fi
    
    return 1
}

# Get functions directory from user
get_functions_dir() {
    echo ""
    echo -e "${YELLOW}Could not auto-detect Open WebUI functions directory.${NC}"
    echo ""
    echo "Please specify the path to your Open WebUI functions directory."
    echo "Common locations:"
    echo "  - /path/to/open-webui/backend/functions"
    echo "  - /path/to/open-webui/functions"
    echo "  - Docker: /app/backend/functions (inside container)"
    echo ""
    read -p "Functions directory: " OPEN_WEBUI_FUNCTIONS_DIR
    
    if [ ! -d "$OPEN_WEBUI_FUNCTIONS_DIR" ]; then
        echo -e "${RED}Error: Directory does not exist: $OPEN_WEBUI_FUNCTIONS_DIR${NC}"
        exit 1
    fi
}

# Install the function
install_function() {
    echo -e "${BLUE}[2/5]${NC} Installing Intelligent RAG function..."
    
    SOURCE_FILE="$SCRIPT_DIR/Intelligent_RAG.py"
    TARGET_FILE="$OPEN_WEBUI_FUNCTIONS_DIR/Intelligent_RAG.py"
    
    if [ ! -f "$SOURCE_FILE" ]; then
        echo -e "${RED}Error: Source file not found: $SOURCE_FILE${NC}"
        exit 1
    fi
    
    cp "$SOURCE_FILE" "$TARGET_FILE"
    echo "    ✓ Installed: $TARGET_FILE"
}

# Create environment configuration
create_env_config() {
    echo -e "${BLUE}[3/5]${NC} Creating environment configuration..."
    
    cat << 'EOF'

═══════════════════════════════════════════════════════════════════
ENVIRONMENT VARIABLES REQUIRED
═══════════════════════════════════════════════════════════════════

Add these to your Open WebUI startup:

# Required
export INTELLIGENT_RAG_URL=http://localhost:8765

# Optional - for direct LLM fallback
export OPENROUTER_API_KEY=sk-or-v1-...

═══════════════════════════════════════════════════════════════════

For systemd service (/etc/systemd/system/open-webui.service):

[Service]
Environment="INTELLIGENT_RAG_URL=http://localhost:8765"
Environment="OPENROUTER_API_KEY=sk-or-v1-..."

For Docker (docker-compose.yml):

services:
  open-webui:
    environment:
      - INTELLIGENT_RAG_URL=http://intelligent-rag:8765
      - OPENROUTER_API_KEY=sk-or-v1-...

═══════════════════════════════════════════════════════════════════
EOF
}

# Verify setup
verify_setup() {
    echo -e "${BLUE}[4/5]${NC} Verifying setup..."
    
    # Check if function file exists
    if [ ! -f "$OPEN_WEBUI_FUNCTIONS_DIR/Intelligent_RAG.py" ]; then
        echo -e "${RED}✗ Function file not found${NC}"
        return 1
    fi
    echo "    ✓ Function file installed"
    
    # Check if RAG service is reachable
    if curl -s http://localhost:8765/health > /dev/null 2>&1; then
        echo "    ✓ Intelligent RAG service is running"
    else
        echo -e "${YELLOW}⚠ Intelligent RAG service not reachable at localhost:8765${NC}"
        echo "      Start it with: intelligent-rag-service start"
    fi
    
    return 0
}

# Print final instructions
print_instructions() {
    echo -e "${BLUE}[5/5]${NC} Setup complete!"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   NEXT STEPS                                               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "1. RESTART Open WebUI to load the function"
    echo ""
    echo "2. SET ENVIRONMENT VARIABLES:"
    echo "   export INTELLIGENT_RAG_URL=http://localhost:8765"
    echo "   export OPENROUTER_API_KEY=sk-or-v1-..."
    echo ""
    echo "3. ENABLE THE FUNCTION:"
    echo "   - Open Open WebUI Admin Panel"
    echo "   - Go to Functions"
    echo "   - Find 'Intelligent RAG' and click 'Enable'"
    echo ""
    echo "4. CONFIGURE VALVES (optional):"
    echo "   - Click on 'Intelligent RAG' function"
    echo "   - Adjust settings:"
    echo "     • Verbose: Show classification details"
    echo "     • TOP_K values per tier"
    echo "     • Direct LLM fallback"
    echo ""
    echo "5. TEST IT:"
    echo "   Send a query like:"
    echo "   • 'What's the auth endpoint?' (Tier 1)"
    echo "   • 'Review the architecture' (Tier 2)"
    echo "   • 'Create architecture diagrams' (Tier 3)"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   TROUBLESHOOTING                                          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "• Check service status: intelligent-rag-service status"
    echo "• View logs: intelligent-rag-service logs"
    echo "• Test classification: curl http://localhost:8765/classify?q=test"
    echo "• Check Open WebUI logs for function errors"
    echo ""
}

# Main
echo "This script will install the Intelligent RAG function for Open WebUI."
echo ""

# Detect or get functions directory
if ! detect_openwebui; then
    get_functions_dir
fi

echo ""
echo "Functions directory: $OPEN_WEBUI_FUNCTIONS_DIR"
echo ""
read -p "Continue with installation? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 0
fi

# Run installation steps
install_function
create_env_config
verify_setup
print_instructions

echo -e "${GREEN}✅ Installation complete!${NC}"
