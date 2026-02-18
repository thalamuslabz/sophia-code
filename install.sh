#!/bin/bash
# Thalamus AI - One-Command Setup for Vibe Coders
# Usage: ./install.sh [options]
# Options:
#   --minimal    Install only Sophia CLI (no containers)
#   --full       Install full stack with Docker (default)
#   --dev        Install with dev dependencies and hot-reload

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
INSTALL_MODE="${1:---full}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOPHIA_VERSION="1.0.0"

# Logging functions
log_info() { echo -e "${BLUE}ℹ${NC}  $1"; }
log_success() { echo -e "${GREEN}✓${NC}  $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
log_error() { echo -e "${RED}✗${NC}  $1"; }
log_step() { echo -e "\n${BLUE}▶${NC}  $1"; }

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        echo "   Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version $NODE_VERSION is too old (need 18+)"
        exit 1
    fi
    log_success "Node.js $(node --version)"
    
    # npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "npm $(npm --version)"
    
    # Docker (for full install)
    if [ "$INSTALL_MODE" != "--minimal" ]; then
        if ! command -v docker &> /dev/null; then
            log_warn "Docker not found. Installing minimal mode only."
            INSTALL_MODE="--minimal"
        else
            log_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
            
            # Check docker-compose
            if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
                log_warn "docker-compose not found. Some features may be limited."
            else
                log_success "Docker Compose available"
            fi
        fi
    fi
    
    # Git
    if ! command -v git &> /dev/null; then
        log_warn "Git not found. Some features may be limited."
    else
        log_success "Git $(git --version | cut -d' ' -f3)"
    fi
}

# Install Sophia CLI
install_sophia_cli() {
    log_step "Installing Sophia CLI..."
    
    cd "$REPO_ROOT/packages/cli"
    
    log_info "Installing dependencies..."
    npm ci --silent
    
    log_info "Building Sophia CLI..."
    npm run build
    
    # Link globally or create alias
    if [ -w "/usr/local/bin" ] || [ -w "/usr/bin" ]; then
        npm link --silent 2>/dev/null || true
        log_success "Sophia CLI linked globally"
    else
        # Create local bin directory
        mkdir -p "$HOME/.local/bin"
        cat > "$HOME/.local/bin/sophia" << 'EOF'
#!/bin/bash
# Sophia CLI wrapper
REPO_ROOT="$(cd "$(dirname "$(dirname "$(readlink -f "$0")")")" && pwd)"
exec node "$REPO_ROOT/packages/cli/dist/index.js" "$@"
EOF
        chmod +x "$HOME/.local/bin/sophia"
        
        # Add to PATH if needed
        if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc" 2>/dev/null || true
            export PATH="$HOME/.local/bin:$PATH"
        fi
        
        log_success "Sophia CLI installed to ~/.local/bin/sophia"
    fi
    
    cd "$REPO_ROOT"
}

# Build packages
build_packages() {
    log_step "Building packages..."
    
    cd "$REPO_ROOT"
    
    # Shared package first (dependency of others)
    log_info "Building @sophia-code/shared..."
    cd packages/shared
    npm ci --silent
    npm run build
    cd "$REPO_ROOT"
    
    # CLI
    log_info "Building @sophia-code/cli..."
    cd packages/cli
    npm ci --silent
    npm run build
    cd "$REPO_ROOT"
    
    # Dashboard (if not in dev mode, we build for production)
    if [ "$INSTALL_MODE" != "--dev" ]; then
        log_info "Building @sophia-code/dashboard..."
        cd packages/dashboard
        npm ci --silent
        npm run build
        cd "$REPO_ROOT"
    fi
    
    # Orchestrator
    log_info "Building @thalamus/orchestrator..."
    cd packages/orchestrator
    npm ci --silent
    npm run build
    cd "$REPO_ROOT"
    
    log_success "All packages built"
}

# Setup Docker infrastructure
setup_docker() {
    log_step "Setting up Docker infrastructure..."
    
    cd "$REPO_ROOT"
    
    # Create required directories
    mkdir -p apps/openwebui-functions
    mkdir -p apps/n8n-workflows
    mkdir -p data/openwebui
    mkdir -p data/n8n
    mkdir -p data/orchestrator
    
    # Copy Open WebUI functions
    log_info "Installing Open WebUI functions..."
    cp -r packages/cli/src/content/openwebui-functions/* apps/openwebui-functions/ 2>/dev/null || true
    
    # Copy n8n workflows
    log_info "Installing n8n workflows..."
    cp -r packages/orchestrator/n8n/workflows/* apps/n8n-workflows/ 2>/dev/null || true
    
    # Start infrastructure
    log_info "Starting containers..."
    docker compose up -d openwebui n8n
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 5
    
    log_success "Docker infrastructure running"
}

# Install Auto-Claude integration
install_auto_claude() {
    log_step "Setting up Auto-Claude integration..."
    
    # Create auto-claude directories
    mkdir -p "$HOME/.auto-claude/specs"
    mkdir -p "$HOME/.auto-claude/processed"
    mkdir -p "$HOME/.auto-claude/logs"
    mkdir -p "$HOME/code/ac-projects"
    
    log_success "Auto-Claude directories created"
}

# Create project templates
setup_templates() {
    log_step "Setting up project templates..."
    
    mkdir -p "$REPO_ROOT/templates"
    
    # Create a sample project template
    cat > "$REPO_ROOT/templates/react-ts/.sophia/config.yaml" << 'EOF'
sophia:
  version: "1.0.0"
  initialized: "2024-01-01T00:00:00Z"
project:
  name: "react-ts-app"
  tech_stack:
    language: "typescript"
    framework: "react"
    package_manager: "npm"
    ui_framework: "shadcn"
    styling: "tailwind"
agents:
  detected: []
user:
  experience_level: "intermediate"
  governance_level: "startup"
session:
  auto_detect: true
  stale_timeout_minutes: 30
  claim_mode: "warn"
policies:
  enabled: ["security", "quality", "testing"]
  strictness: "moderate"
teaching:
  enabled: true
  show_explanations: true
  first_time_hints: true
health:
  auto_score: true
  score_on_commit: true
EOF
    
    log_success "Templates ready"
}

# Print final instructions
print_welcome() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           🚀 Thalamus AI Setup Complete!                     ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Quick Start:${NC}"
    echo ""
    echo "  1. ${YELLOW}Start coding:${NC}"
    echo "     cd my-project"
    echo "     sophia init"
    echo ""
    
    if [ "$INSTALL_MODE" != "--minimal" ]; then
        echo "  2. ${YELLOW}Open the Productivity Hub:${NC}"
        echo "     Open WebUI:  http://localhost:3115"
        echo "     n8n:         http://localhost:3118"
        echo "     Dashboard:   http://localhost:9473"
        echo ""
        echo "  3. ${YELLOW}Create your first build spec:${NC}"
        echo "     Go to http://localhost:3115"
        echo "     Type: /build Create a React todo app"
        echo ""
    fi
    
    echo "  ${YELLOW}Available Commands:${NC}"
    echo "    sophia status      - View project status"
    echo "    sophia dashboard   - Open governance dashboard"
    echo "    sophia sync        - Re-sync agent configs"
    echo ""
    echo "  ${YELLOW}Documentation:${NC}"
    echo "    Getting Started:  ./docs/VIBE_CODER_GUIDE.md"
    echo "    Full Docs:        ./docs/README.md"
    echo ""
    echo -e "${GREEN}Happy vibe coding! 🎵${NC}"
    echo ""
}

# Main installation flow
main() {
    echo -e "${BLUE}"
    echo "  ████████╗██╗  ██╗ █████╗ ██╗      █████╗ ███╗   ███╗██╗   ██╗███████╗"
    echo "  ╚══██╔══╝██║  ██║██╔══██╗██║     ██╔══██╗████╗ ████║██║   ██║██╔════╝"
    echo "     ██║   ███████║███████║██║     ███████║██╔████╔██║██║   ██║███████╗"
    echo "     ██║   ██╔══██║██╔══██║██║     ██╔══██║██║╚██╔╝██║██║   ██║╚════██║"
    echo "     ██║   ██║  ██║██║  ██║███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝███████║"
    echo "     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝"
    echo "                                                                      "
    echo "              AI-Powered Development Environment                      "
    echo -e "${NC}"
    
    log_info "Install mode: $INSTALL_MODE"
    log_info "Repository: $REPO_ROOT"
    
    # Run installation steps
    check_prerequisites
    build_packages
    install_auto_claude
    setup_templates
    
    if [ "$INSTALL_MODE" != "--minimal" ]; then
        setup_docker
    fi
    
    print_welcome
}

# Handle script interruption
trap 'log_error "Installation interrupted"; exit 1' INT

# Run main function
main
