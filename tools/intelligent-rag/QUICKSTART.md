# Intelligent RAG - Quick Start Guide

Get started with Intelligent RAG in 5 minutes.

## Option 1: Local Installation (Recommended for Development)

```bash
cd tools/intelligent-rag

# Install
./install.sh

# Start the server
rag-cli start

# Test it
rag-cli classify "What's the auth endpoint?"
```

## Option 2: Docker

```bash
cd tools/intelligent-rag

# Build and run
docker build -t intelligent-rag .
docker run -p 8765:8765 intelligent-rag

# Or use docker-compose
docker-compose up -d
```

## Option 3: Direct Python

```bash
cd tools/intelligent-rag

# No installation needed
python3 intelligent_rag.py server --port 8765

# In another terminal
python3 intelligent_rag.py --classify "What's the auth endpoint?"
```

## Open WebUI Integration

### Step 1: Start the Classification Server

```bash
rag-cli start
```

### Step 2: Install the Function

1. Copy the function file:
   ```bash
   cp apps/openwebui-functions/Intelligent_RAG.py /path/to/openwebui/functions/
   ```

2. Set the environment variable:
   ```bash
   export INTELLIGENT_RAG_URL=http://localhost:8765
   ```

3. Restart Open WebUI

### Step 3: Enable the Function

1. Go to Open WebUI Admin Panel
2. Navigate to Functions
3. Find "Intelligent RAG" and click Enable

## Verification

Test the integration:

```bash
# Test classification
curl "http://localhost:8765/classify?q=What's%20the%20auth%20endpoint"

# Should return:
# {
#   "query": "What's the auth endpoint?",
#   "classification": {
#     "type": "specific_lookup",
#     "confidence": 0.85,
#     "recommended_tier": 1,
#     ...
#   }
# }
```

## Usage Examples

### Example 1: Specific Lookup (Tier 1)

**Query**: "What's the auth endpoint?"

**Classification**: Tier 1 - Specific Lookup

**Strategy**: Standard RAG with TOP_K=15

### Example 2: Architecture Question (Tier 2)

**Query**: "How does the authentication service connect to the database?"

**Classification**: Tier 2 - Comprehensive Analysis

**Strategy**: Expanded RAG with TOP_K=50

### Example 3: Creative Task (Tier 3)

**Query**: "Create a complete architecture diagram"

**Classification**: Tier 3 - Creative Synthesis

**Strategy**: Full Context with RAG_FULL_CONTEXT=True

## Next Steps

1. **Read the full documentation**: [README.md](README.md)
2. **Try interactive mode**: `rag-cli interactive`
3. **Run test queries**: `rag-cli test`
4. **Customize classification**: Edit `intelligent_rag.py`

## Troubleshooting

### Server won't start

```bash
# Check if port is in use
lsof -i :8765

# Use different port
rag-cli start 8766
```

### Classification not working

```bash
# Check server status
rag-cli status

# Test directly
python3 intelligent_rag.py --classify "test query"
```

### Open WebUI integration issues

1. Verify server is running: `rag-cli status`
2. Check `INTELLIGENT_RAG_URL` environment variable
3. Look at Open WebUI logs for errors
4. Enable verbose mode in function valves

## Support

- Full documentation: [README.md](README.md)
- System prompt templates: [system-prompt-template.md](system-prompt-template.md)
- Original design: [intelligent-rag-design.md](../intelligent-rag-design.md)
