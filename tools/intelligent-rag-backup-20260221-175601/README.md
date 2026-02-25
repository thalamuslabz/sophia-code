# Intelligent Adaptive RAG System

An intelligent context management system for Open WebUI that dynamically determines the appropriate RAG (Retrieval-Augmented Generation) strategy based on query classification.

> **🚀 Looking for the complete solution with LLM classification and permanent setup?**
> 
> See **[SOLUTION.md](SOLUTION.md)** for:
> - LLM-powered classification (OpenRouter integration)
> - Permanent installation (auto-start on boot)
> - n8n workflow integration
> - Cost analysis and savings breakdown

## Problem Statement

Current RAG systems use a one-size-fits-all approach:
- **Chunked RAG**: Cost-effective but misses cross-document context
- **Full Context**: Comprehensive but token-prohibitive for every query

**Goal**: Intelligently determine context depth based on query type

## Solution: Multi-Tier Context Strategy

| Tier | Name | Method | Use For | Example |
|------|------|--------|---------|---------|
| 1 | Standard Queries | Chunked RAG, TOP_K=15 | Specific questions, lookups | "What's the API endpoint?" |
| 2 | Comprehensive Analysis | Expanded RAG, TOP_K=50 | Architecture, design decisions | "Review the authentication architecture" |
| 3 | Full Knowledge Base | RAG_FULL_CONTEXT=True | Complete system understanding | "Create a full architecture diagram package" |

## Quick Start

### 1. Start the Classification Server

```bash
# Make CLI executable and start server
chmod +x rag-cli
./rag-cli start

# Or start on a custom port
./rag-cli start 8080
```

The server will run at `http://localhost:8765` by default.

### 2. Test Classification

```bash
# Classify a single query
./rag-cli classify "What's the auth endpoint?"

# Interactive mode
./rag-cli interactive

# Run test suite
./rag-cli test
```

### 3. Install Open WebUI Function

1. Copy `Intelligent_RAG.py` to your Open WebUI functions directory
2. Restart Open WebUI
3. Enable the function in the admin panel

## Installation

### Prerequisites

- Python 3.8+
- Open WebUI 0.5.0+ (for function integration)

### Setup

```bash
# Clone or navigate to the intelligent-rag directory
cd tools/intelligent-rag

# Make scripts executable
chmod +x rag-cli intelligent_rag.py

# Install as a service (macOS)
./rag-cli install-service
```

## Usage

### CLI Commands

```bash
# Server management
./rag-cli start [port] [host]     # Start the classification server
./rag-cli stop                     # Stop the server
./rag-cli status                   # Check server status
./rag-cli logs                     # View server logs

# Classification
./rag-cli classify "your query"    # Classify a single query
./rag-cli interactive              # Run interactive mode
./rag-cli test                     # Run test queries
```

### Python API

```python
from intelligent_rag import QueryClassifier, RAGResponseHandler

# Classify a query
classifier = QueryClassifier()
result = classifier.classify("What's the auth endpoint?")

print(f"Type: {result.query_type.value}")
print(f"Tier: {result.recommended_tier}")
print(f"RAG_FULL_CONTEXT: {result.rag_full_context}")
print(f"TOP_K: {result.top_k}")
```

### HTTP API

The server provides a REST API for integration:

#### Classify Query

```bash
# GET request
curl "http://localhost:8765/classify?q=What's%20the%20auth%20endpoint"

# POST request
curl -X POST http://localhost:8765/classify \
  -H "Content-Type: application/json" \
  -d '{"query": "What'\''s the auth endpoint?"}'
```

Response:
```json
{
  "query": "What's the auth endpoint?",
  "classification": {
    "type": "specific_lookup",
    "confidence": 0.85,
    "reasoning": "Specific keywords (3) >= comprehensive (0)...",
    "recommended_tier": 1,
    "rag_full_context": false,
    "top_k": 15
  },
  "system_prompt_addition": "Use the provided RAG context chunks..."
}
```

#### Check Response for Full Context Request

```bash
curl -X POST http://localhost:8765/check-response \
  -H "Content-Type: application/json" \
  -d '{
    "response": "[REQUEST_FULL_CONTEXT] Need to see all authentication docs",
    "rag_config": {"top_k": 15}
  }'
```

Response:
```json
{
  "has_full_context_request": true,
  "reasoning": "Need to see all authentication docs",
  "reroll_config": {
    "rag_full_context": true,
    "top_k": 100,
    "reason": "Need to see all authentication docs",
    "is_reroll": true
  }
}
```

## Open WebUI Integration

### Function Installation

1. Copy `Intelligent_RAG.py` from `apps/openwebui-functions/` to your Open WebUI functions folder:
   - Docker: Mount to `/app/backend/functions/`
   - Local: Copy to the functions directory in your Open WebUI installation

2. Set environment variable:
   ```bash
   export INTELLIGENT_RAG_URL=http://localhost:8765
   ```

3. Restart Open WebUI

4. Enable the function:
   - Go to Admin Panel → Functions
   - Find "Intelligent RAG"
   - Click "Enable"

### Configuration

The function provides valves for configuration:

| Valve | Default | Description |
|-------|---------|-------------|
| `enabled` | `true` | Enable/disable classification |
| `classifier_url` | `http://localhost:8765` | URL of classifier service |
| `auto_reroll` | `true` | Auto-reroll when full context requested |
| `verbose` | `false` | Show classification details |
| `tier1_top_k` | `15` | TOP_K for Tier 1 |
| `tier2_top_k` | `50` | TOP_K for Tier 2 |
| `tier3_top_k` | `100` | TOP_K for Tier 3 |

### How It Works

1. **Query Classification**: When a user sends a message, the function classifies it
2. **RAG Adjustment**: Based on classification, TOP_K and RAG_FULL_CONTEXT are adjusted
3. **System Prompt**: Classification guidance is added to the system prompt
4. **Response Monitoring**: The function checks if the model requests full context
5. **Auto-Reroll**: If full context is requested, settings are updated for a rerun

## Query Classification

### Classification Types

#### 1. Specific Lookup (Tier 1)

**Keywords**: `what is`, `how to`, `endpoint`, `api`, `function`, `method`, `code`, `example`

**Characteristics**:
- Direct questions
- Specific code lookups
- Configuration queries
- Error debugging

**Strategy**: Standard chunked RAG with TOP_K=15

---

#### 2. Comprehensive Analysis (Tier 2)

**Keywords**: `architecture`, `design pattern`, `integration`, `review`, `analyze`, `assess`

**Characteristics**:
- Architecture questions
- Design pattern discussions
- Integration planning
- System analysis

**Strategy**: Expanded RAG with TOP_K=50

---

#### 3. Creative Synthesis (Tier 3)

**Patterns**:
- `create a diagram`
- `generate documentation`
- `full architecture`
- `comprehensive package`

**Characteristics**:
- Creating diagrams
- Generating documentation
- Complete system overviews
- Creative tasks

**Strategy**: Full knowledge base with RAG_FULL_CONTEXT=True

### Confidence Scoring

The classifier uses keyword matching and pattern detection:

```
confidence = base_score + (keyword_matches * weight)
```

- **Tier 1**: 60-90% confidence for specific lookups
- **Tier 2**: 60-90% confidence for comprehensive queries
- **Tier 3**: 70-95% confidence for creative synthesis

## Decision Matrix

| Query Type | Example | Tier | Strategy |
|------------|---------|------|----------|
| Lookup | "What's the auth endpoint?" | 1 | Chunked RAG |
| Tutorial | "How do I implement OAuth?" | 1 | Chunked RAG |
| Architecture | "Design the data flow" | 2-3 | Full Context |
| Integration | "How does Service A connect to B?" | 2 | Expanded RAG |
| Review | "Review this architecture" | 2 | Expanded RAG |
| Creative | "Create documentation" | 3 | Full Context |
| Debug | "Why is this failing?" | 1 | Chunked RAG |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Query Router                              │
│                                                              │
│  User Query ──► Intent Classification                       │
│                     │                                        │
│                     ▼                                        │
│         ┌──────────┴──────────┐                             │
│         │                     │                              │
│    Specific Query      Comprehensive Query                   │
│         │                     │                              │
│         ▼                     ▼                              │
│  ┌────────────┐       ┌──────────────┐                      │
│  │ Chunked    │       │ Full Context │                      │
│  │ RAG        │       │ Retrieval    │                      │
│  │ TOP_K=15   │       │ All Docs     │                      │
│  └────────────┘       └──────────────┘                      │
│         │                     │                              │
│         └──────────┬──────────┘                              │
│                    ▼                                         │
│              ┌──────────┐                                    │
│              │  LLM     │                                    │
│              │ Response │                                    │
│              └──────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

## Metrics to Monitor

1. **Context Coverage**: % of KB files used in response
2. **Token Efficiency**: Cost per query by classification
3. **Accuracy**: Rate of hallucinations vs comprehensive queries
4. **User Override**: How often users need to ask for "more context"

## Troubleshooting

### Server Won't Start

```bash
# Check if port is already in use
lsof -i :8765

# Kill existing process or use different port
./rag-cli start 8766
```

### Classification Not Working in Open WebUI

1. Check server is running: `./rag-cli status`
2. Verify `INTELLIGENT_RAG_URL` environment variable
3. Check Open WebUI logs for function errors
4. Enable verbose mode in function valves

### High Token Usage

- Review classification thresholds
- Adjust TOP_K values per tier
- Monitor query classification distribution

## Development

### Running Tests

```bash
# Run test queries
./rag-cli test

# Or directly with Python
python3 intelligent_rag.py --interactive
```

### Adding New Classification Patterns

Edit `intelligent_rag.py` and modify the keyword lists:

```python
class QueryClassifier:
    COMPREHENSIVE_KEYWORDS = [
        # Add your keywords here
        "your-new-keyword",
        ...
    ]
```

### API Extension

The HTTP server can be extended by adding new endpoints to `IntelligentRAGServer`:

```python
def do_GET(self):
    # ... existing code ...
    elif path == "/your-endpoint":
        self.send_json({"result": "custom"})
```

## Integration with Existing Tools

### Knowledge Sync

Works seamlessly with `tools/knowledge-sync`:

```yaml
# In your Open WebUI knowledge base config
intelligent_rag:
  enabled: true
  classifier_url: http://localhost:8765
```

### n8n Workflows

Use the HTTP API in n8n workflows:

```javascript
// HTTP Request node
const response = await $httpRequest({
  method: 'POST',
  url: 'http://localhost:8765/classify',
  body: {
    query: $input.first().json.query
  }
});
return [{json: response}];
```

## Roadmap

### Phase 1: Simple Query Classification ✅
- ✅ Keyword-based classification
- ✅ Three-tier system
- ✅ HTTP API
- ✅ Open WebUI Function

### Phase 2: Automatic Full-Context Trigger 🔄
- ✅ Response pattern detection
- 🔄 Automatic reroll with full context
- 🔄 Conversation memory

### Phase 3: Persistent Memory Layer 📋
- 📋 Store key facts and decisions
- 📋 Reference memory in queries
- 📋 Reduce redundant retrievals

## License

MIT - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Last Updated**: 2026-02-21  
**Version**: 1.0.0
