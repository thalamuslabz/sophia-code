#!/bin/bash
#
# Permanent Installation Script for Intelligent RAG
#
# This script installs the Intelligent RAG system as a permanent service
# that runs automatically on system startup.
#
# Usage:
#   ./install-permanent.sh [--with-llm] [--with-n8n]
#
# Options:
#   --with-llm    Enable LLM-powered classification (requires OPENROUTER_API_KEY)
#   --with-n8n    Also set up n8n integration
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_TYPE="${1:-docker}"
WITH_LLM=false
WITH_N8N=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --with-llm)
            WITH_LLM=true
            shift
            ;;
        --with-n8n)
            WITH_N8N=true
            shift
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}  Intelligent RAG - Permanent Installation${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}[1/6]${NC} Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is required${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is required${NC}"
    exit 1
fi

echo "    ✓ Docker found"
echo "    ✓ Docker Compose found"

# Check for network
echo -e "${BLUE}[2/6]${NC} Checking Docker network..."
if ! docker network inspect sophia-network &> /dev/null; then
    echo "    Creating sophia-network..."
    docker network create sophia-network
else
    echo "    ✓ sophia-network exists"
fi

# Prompt for OpenRouter API key if --with-llm
echo -e "${BLUE}[3/6]${NC} Configuration..."

if [ "$WITH_LLM" = true ]; then
    if [ -z "$OPENROUTER_API_KEY" ]; then
        echo -n "    Enter OpenRouter API key (optional, press Enter to skip): "
        read -s OPENROUTER_API_KEY
        echo ""
    fi
    
    if [ -n "$OPENROUTER_API_KEY" ]; then
        echo "    ✓ LLM classification will be enabled"
    else
        echo -e "${YELLOW}    ⚠ No API key provided, LLM classification disabled${NC}"
        WITH_LLM=false
    fi
else
    echo "    Using keyword-based classification (no LLM)"
fi

# Create .env file
echo -e "${BLUE}[4/6]${NC} Creating environment configuration..."

cat > "$SCRIPT_DIR/.env" << EOF
# Intelligent RAG Configuration
# Generated on $(date)

# Service Configuration
INTELLIGENT_RAG_PORT=8765

# LLM Classification (optional but recommended)
OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
CLASSIFIER_MODEL=google/gemini-flash-1.5
USE_LLM_CLASSIFIER=${WITH_LLM}
LLM_CONFIDENCE_THRESHOLD=0.7

# n8n Integration
N8N_RAG_ENABLED=${WITH_N8N}
EOF

echo "    ✓ Created .env file"

# Build and start
echo -e "${BLUE}[5/6]${NC} Building and starting services..."

cd "$SCRIPT_DIR"

# Build the image
docker-compose -f docker-compose.permanent.yml build

# Start the service
docker-compose -f docker-compose.permanent.yml up -d

# Wait for healthcheck
echo "    Waiting for service to be healthy..."
sleep 5

for i in {1..10}; do
    if curl -s http://localhost:8765/health > /dev/null 2>&1; then
        echo "    ✓ Service is healthy"
        break
    fi
    echo "    Checking... ($i/10)"
    sleep 2
done

# Create startup script for system boot
echo -e "${BLUE}[6/6]${NC} Setting up auto-start..."

STARTUP_SCRIPT="$HOME/.local/bin/intelligent-rag-service"
mkdir -p "$HOME/.local/bin"

cat > "$STARTUP_SCRIPT" << 'EOF'
#!/bin/bash
# Intelligent RAG Service Control

SCRIPT_DIR="SCRIPT_DIR_PLACEHOLDER"

case "${1:-status}" in
    start)
        cd "$SCRIPT_DIR"
        docker-compose -f docker-compose.permanent.yml up -d
        echo "Intelligent RAG started"
        ;;
    stop)
        cd "$SCRIPT_DIR"
        docker-compose -f docker-compose.permanent.yml down
        echo "Intelligent RAG stopped"
        ;;
    restart)
        cd "$SCRIPT_DIR"
        docker-compose -f docker-compose.permanent.yml restart
        echo "Intelligent RAG restarted"
        ;;
    status)
        curl -s http://localhost:8765/health | jq . 2>/dev/null || echo "Service not responding"
        ;;
    logs)
        cd "$SCRIPT_DIR"
        docker-compose -f docker-compose.permanent.yml logs -f
        ;;
    *)
        echo "Usage: intelligent-rag-service {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
EOF

# Replace placeholder with actual directory
sed -i.bak "s|SCRIPT_DIR_PLACEHOLDER|$SCRIPT_DIR|g" "$STARTUP_SCRIPT"
rm "$STARTUP_SCRIPT.bak"
chmod +x "$STARTUP_SCRIPT"

echo "    ✓ Created control script: intelligent-rag-service"

# Create launchd plist for macOS auto-start
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLIST_PATH="$HOME/Library/LaunchAgents/com.thalamus.intelligent-rag.permanent.plist"
    
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.thalamus.intelligent-rag.permanent</string>
    <key>ProgramArguments</key>
    <array>
        <string>$STARTUP_SCRIPT</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/intelligent-rag.out</string>
    <key>StandardErrorPath</key>
    <string>/tmp/intelligent-rag.err</string>
</dict>
</plist>
EOF

    # Load the service
    launchctl load "$PLIST_PATH" 2>/dev/null || true
    
    echo "    ✓ Created launchd service (auto-starts on boot)"
    echo "    Control: launchctl {start|stop} com.thalamus.intelligent-rag.permanent"
fi

# Summary
echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo "Service Status:"
echo "  URL: http://localhost:8765"
echo "  Health: curl http://localhost:8765/health"
echo ""
echo "Management Commands:"
echo "  intelligent-rag-service status     # Check status"
echo "  intelligent-rag-service stop       # Stop service"
echo "  intelligent-rag-service start      # Start service"
echo "  intelligent-rag-service logs       # View logs"
echo ""

if [ "$WITH_LLM" = true ]; then
    echo -e "${GREEN}LLM Classification:${NC} Enabled"
    echo "  Model: google/gemini-flash-1.5"
    echo "  Est. cost: ~$0.0001 per classification"
    echo ""
fi

echo "Open WebUI Integration:"
echo "  Set environment variable:"
echo "    export INTELLIGENT_RAG_URL=http://localhost:8765"
echo ""
echo "Then copy Intelligent_RAG.py to your Open WebUI functions folder."
echo ""

# Test the service
echo "Testing service..."
TEST_RESULT=$(curl -s "http://localhost:8765/classify?q=test%20query" 2>/dev/null || echo '{"error": "Service not ready"}')
echo "  Response: $TEST_RESULT"
echo ""
