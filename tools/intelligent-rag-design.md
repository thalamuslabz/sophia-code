# Intelligent Adaptive Context Management for Open WebUI

> **Status**: ✅ **IMPLEMENTED**
>
> See implementation in `./intelligent-rag/` directory

## Implementation Summary

The Intelligent RAG system has been implemented with the following components:

### 📁 Implementation Location
```
tools/intelligent-rag/
├── intelligent_rag.py          # Core classification engine
├── rag-cli                      # CLI management tool
├── Intelligent_RAG.py          # Open WebUI Function
├── README.md                    # Full documentation
├── QUICKSTART.md               # Quick start guide
├── DESIGN.md                   # Original design document
├── system-prompt-template.md   # System prompt templates
├── requirements.txt            # Python dependencies
├── install.sh                  # Installation script
├── Dockerfile                  # Container image
├── docker-compose.yml          # Docker Compose config
└── __init__.py                 # Python package init
```

### 🚀 Quick Start

```bash
# Navigate to implementation
cd tools/intelligent-rag

# Install
./install.sh

# Start server
rag-cli start

# Test
rag-cli classify "What's the auth endpoint?"
```

### 📚 Documentation

- **[QUICKSTART.md](intelligent-rag/QUICKSTART.md)** - Get started in 5 minutes
- **[README.md](intelligent-rag/README.md)** - Complete documentation
- **[DESIGN.md](intelligent-rag/DESIGN.md)** - Original design specification

### 🔧 Components

1. **Core Engine** (`intelligent_rag.py`)
   - Query classification with keyword matching
   - Three-tier context strategy
   - HTTP API server
   - Response monitoring

2. **CLI Tool** (`rag-cli`)
   - Server management (start/stop/status)
   - Interactive classification mode
   - Test suite
   - Service installation

3. **Open WebUI Function** (`Intelligent_RAG.py`)
   - Automatic query classification
   - Dynamic RAG setting adjustment
   - Full context request detection
   - Auto-reroll capability

### ✨ Features Implemented

- ✅ Query classification (3 tiers)
- ✅ HTTP REST API
- ✅ Open WebUI Function integration
- ✅ CLI management tool
- ✅ Docker containerization
- ✅ System prompt templates
- ✅ Response pattern detection
- ✅ Confidence scoring
- ✅ Classification caching

### 📊 Three-Tier Strategy

| Tier | Query Type | TOP_K | Full Context |
|------|-----------|-------|--------------|
| 1 | Specific Lookup | 15 | No |
| 2 | Comprehensive Analysis | 50 | No |
| 3 | Creative Synthesis | 100 | Yes |

### 🔗 Integration

Works seamlessly with:
- `tools/knowledge-sync` - Knowledge base synchronization
- `apps/openwebui-functions` - Open WebUI function framework
- `apps/n8n-workflows` - n8n automation workflows

---

*For full details, see the [implementation README](intelligent-rag/README.md)*
