# Open WebUI + Intelligent RAG Integration

Complete integration of Intelligent RAG with Open WebUI using x-ai/grok-4.1-fast for high-accuracy query classification.

## Overview

This integration automatically classifies user queries and adjusts RAG settings:
- **Tier 1**: Standard queries → TOP_K=15
- **Tier 2**: Comprehensive → TOP_K=50
- **Tier 3**: Creative → RAG_FULL_CONTEXT=True

## Quick Setup

### Prerequisites

- Open WebUI 0.5.0+
- Intelligent RAG service running (see `../../tools/intelligent-rag/`)
- OpenRouter API key (for LLM classification)

### One-Command Setup

```bash
cd sophia-code/apps/openwebui-functions
./setup-openwebui.sh
```

### Manual Setup

#### Step 1: Install the Function

```bash
# Copy function to Open WebUI
cp Intelligent_RAG.py /path/to/open-webui/backend/functions/

# Or for Docker
docker cp Intelligent_RAG.py open-webui-container:/app/backend/functions/
```

#### Step 2: Set Environment Variables

```bash
# Required - URL of the classifier service
export INTELLIGENT_RAG_URL=http://localhost:8765

# Optional - for direct LLM fallback
export OPENROUTER_API_KEY=sk-or-v1-...
```

**For systemd:**
```ini
# /etc/systemd/system/open-webui.service
[Service]
Environment="INTELLIGENT_RAG_URL=http://localhost:8765"
Environment="OPENROUTER_API_KEY=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"
```

**For Docker Compose:**
```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    environment:
      - INTELLIGENT_RAG_URL=http://host.docker.internal:8765
      - OPENROUTER_API_KEY=sk-or-v1-...
    volumes:
      - ./Intelligent_RAG.py:/app/backend/functions/Intelligent_RAG.py
```

#### Step 3: Restart Open WebUI

```bash
# Systemd
sudo systemctl restart open-webui

# Docker
docker-compose restart open-webui
```

#### Step 4: Enable in Admin Panel

1. Open Open WebUI
2. Go to **Admin Panel** → **Functions**
3. Find **"Intelligent RAG"**
4. Click **Enable**

#### Step 5: Configure Valves (Optional)

Click on the function to configure:

| Valve | Default | Description |
|-------|---------|-------------|
| `enabled` | `true` | Enable/disable classification |
| `classifier_url` | `http://localhost:8765` | Classifier service URL |
| `verbose` | `true` | Show classification in responses |
| `tier1_top_k` | `15` | TOP_K for Tier 1 |
| `tier2_top_k` | `50` | TOP_K for Tier 2 |
| `tier3_top_k` | `100` | TOP_K for Tier 3 |
| `use_direct_llm` | `true` | Direct LLM fallback |
| `openrouter_api_key` | `""` | API key (or use env) |
| `llm_model` | `x-ai/grok-4.1-fast` | Model for classification |

## How It Works

### Query Flow

```
User Query → Classification → Adjust RAG Settings → LLM Response
                ↓
        Tier 1: TOP_K=15
        Tier 2: TOP_K=50
        Tier 3: RAG_FULL_CONTEXT=True
```

### Classification Display

When `verbose=true`, each response shows:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 INTELLIGENT RAG CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query Type: COMPREHENSIVE_ANALYSIS
Tier: 2/3
Confidence: 85%
Strategy: Expanded RAG
TOP_K: 50
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Response Monitoring

The function monitors for `[REQUEST_FULL_CONTEXT]` markers:

```
User: "How does auth work?"
Assistant: "[REQUEST_FULL_CONTEXT] I need to see the complete auth flow..."
→ Function detects and flags for full context
```

## Configuration Examples

### Local Development

```bash
# Terminal 1: Start RAG service
intelligent-rag-service start

# Terminal 2: Start Open WebUI with env vars
export INTELLIGENT_RAG_URL=http://localhost:8765
export OPENROUTER_API_KEY=sk-or-v1-...
./start.sh
```

### Docker Production

```yaml
version: '3.8'

services:
  intelligent-rag:
    build: ./tools/intelligent-rag
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - CLASSIFIER_MODEL=x-ai/grok-4.1-fast
    ports:
      - "8765:8765"
    networks:
      - rag-network

  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    environment:
      - INTELLIGENT_RAG_URL=http://intelligent-rag:8765
    volumes:
      - ./apps/openwebui-functions/Intelligent_RAG.py:/app/backend/functions/Intelligent_RAG.py
    networks:
      - rag-network

networks:
  rag-network:
    driver: bridge
```

### Multiple Model Presets

You can create different models in Open WebUI with different RAG strategies:

**Model: Standard Assistant**
- Function: Intelligent RAG (default settings)

**Model: Architecture Assistant**  
- Function: Intelligent RAG
- Override: Always use Tier 3 settings

**Model: Code Assistant**
- Function: Intelligent RAG
- Override: Lower TOP_K for focused code lookup

## Troubleshooting

### Function Not Appearing

1. Check file is in correct location:
   ```bash
   ls /path/to/open-webui/backend/functions/Intelligent_RAG.py
   ```

2. Restart Open WebUI completely

3. Check Open WebUI logs:
   ```bash
   docker logs open-webui 2>&1 | grep -i "intelligent"
   ```

### Classification Not Working

1. Check RAG service:
   ```bash
   curl http://localhost:8765/health
   ```

2. Check environment variable:
   ```bash
   echo $INTELLIGENT_RAG_URL
   ```

3. Enable verbose mode in function valves

### High Token Usage

1. Check classification distribution:
   ```bash
   intelligent-rag-service logs | grep "Tier"
   ```

2. Adjust confidence threshold in valves

3. Consider using keyword-only for some models

## Testing

### Test Classification

```bash
# Test Tier 1
curl "http://localhost:8765/classify?q=What's%20the%20API%20endpoint"

# Test Tier 2
curl "http://localhost:8765/classify?q=Review%20the%20architecture"

# Test Tier 3
curl "http://localhost:8765/classify?q=Create%20complete%20diagrams"
```

### Test in Open WebUI

1. Start a new chat
2. Send: "What's the auth endpoint?"
3. Check for classification banner in response
4. Try: "Create a full architecture diagram"
5. Should show Tier 3 with full context

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Open WebUI                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Intelligent RAG Function                             │  │
│  │  • Inlet: Classify query, adjust RAG                  │  │
│  │  • Outlet: Monitor for full context requests          │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
│                       ▼                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Messages with classification metadata                │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Local RAG   │ │  OpenRouter  │ │    n8n       │
│  Service     │ │  (Grok)      │ │  (Fallback)  │
│  (Primary)   │ │  (Direct)    │ │  (Workflow)  │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Cost Analysis

Using x-ai/grok-4.1-fast:

| Metric | Value |
|--------|-------|
| Cost per classification | ~$0.0001-0.0002 |
| Hybrid approach | 70% keyword (free) |
| Effective cost | ~$0.00006/query |
| Monthly (1000/day) | ~$1.80 |
| Wrong context prevented | ~$90 saved |
| **Net savings** | **~$88/month** |

## Support

- Intelligent RAG docs: `../../tools/intelligent-rag/README.md`
- Solution guide: `../../tools/intelligent-rag/SOLUTION.md`
- Open WebUI docs: https://docs.openwebui.com

## License

MIT - See LICENSE file
