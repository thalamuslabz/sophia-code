# RAG Fix Instructions

**Agent Task**: Configure Open WebUI RAG to deliver full document context  
**Priority**: High  
**Estimated Time**: 30-60 minutes

---

## Prerequisites

1. Verify services are running:
```bash
curl http://localhost:3115/health   # Open WebUI
curl http://localhost:8765/health   # Intelligent RAG
curl http://localhost:6333/healthz  # Qdrant
```

2. Set environment variable:
```bash
export OPEN_WEBUI_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkYzFlM2U1LWY1ZGYtNDY3Yy1hNjRlLTgyYzYwN2I1MmNmMCIsImV4cCI6MTc3NDEzNTE1MCwianRpIjoiZWM4ODQ0NTUtMjdiZS00OTM0LTliY2UtZGQzOTgxM2IyZTZmIn0.NUwsNr1ctBefFb-c4w8UP04uycinoDxui0paa6RWlT8"
```

---

## Fix Option 1: Update Open WebUI Admin Settings (Recommended)

### Step 1: Access Admin Configuration

```bash
# Get current RAG config
curl -s -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
  http://localhost:3115/api/v1/configs/ | python3 -m json.tool | grep -A 50 '"rag"'
```

### Step 2: Update RAG Settings

Update these specific settings via API or Web UI:

```json
{
  "rag": {
    "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
    "reranking_model": "",
    "chunk_size": 4000,           // INCREASE from default (usually 1000-1500)
    "chunk_overlap": 200,         // INCREASE overlap
    "top_k": 15,                  // Will be overridden by Intelligent RAG
    "template": "Use the following context as your learned knowledge...",
    "enable_rag_full_context": true,  // ENABLE this
    "max_context_window": 50000       // INCREASE this
  }
}
```

**API Call to Update:**
```bash
curl -X POST \
  -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rag": {
      "chunk_size": 4000,
      "chunk_overlap": 200,
      "enable_rag_full_context": true,
      "max_context_window": 50000
    }
  }' \
  http://localhost:3115/api/v1/configs/
```

---

## Fix Option 2: Re-upload Files with Better Chunking

If settings update doesn't work, re-process files with larger chunks:

### Step 1: Delete Existing Knowledge Bases

```bash
# Get all KB IDs
curl -s -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
  http://localhost:3115/api/v1/knowledge/ | python3 -c "
import sys, json
d = json.load(sys.stdin)
for kb in d.get('items', []):
    print(kb['id'])
" | while read KB_ID; do
  curl -s -X DELETE \
    -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
    "http://localhost:3115/api/v1/knowledge/$KB_ID"
  echo "Deleted: $KB_ID"
done
```

### Step 2: Update Chunking Config in Database

```bash
# Copy DB locally
docker cp thalamus-openwebui:/app/backend/data/webui.db /tmp/webui.db

# Update chunk settings
sqlite3 /tmp/webui.db << 'EOF'
-- Update any existing config
UPDATE config 
SET data = json_set(data, '$.rag.chunk_size', 4000),
    data = json_set(data, '$.rag.chunk_overlap', 200),
    data = json_set(data, '$.rag.enable_rag_full_context', json('true'))
WHERE id = 'rag';
EOF

# Copy back
docker cp /tmp/webui.db thalamus-openwebui:/app/backend/data/webui.db
docker restart thalamus-openwebui
```

### Step 3: Re-upload Files

**Option A: Manual via Web UI (Recommended)**
1. Go to http://localhost:3115
2. Knowledge → Create Knowledge Base
3. Upload files from:
   - `~/repos/thalamus-ai/SYNAPTICA/docs/master-production`
   - `~/repos/thalamus-ai/ExecutionIQ/docs/master-production`
   - `~/Documents/companies/*/docs/master`

**Option B: API Upload Script**

See: `/docs/remediation/rag_upload_script.py`

---

## Fix Option 3: Modify Intelligent RAG Filter

If Open WebUI's native settings don't work, modify the filter to inject full context directly:

### Location
`/app/backend/functions/function_intelligent_rag.py` (in container)

### Modification

Add this to the `inlet` method before returning:

```python
# Force full document retrieval by modifying knowledge settings
if "knowledge" not in body:
    body["knowledge"] = {}

body["knowledge"]["rag_full_context"] = True
body["knowledge"]["top_k"] = 100
body["knowledge"]["retrieval_mode"] = "full"  # If supported

# Also inject into params if present
if "params" not in body:
    body["params"] = {}
body["params"]["rag_full_context"] = True
```

### Apply Changes

```bash
# Copy modified file to container
docker cp /path/to/modified_function.py thalamus-openwebui:/app/backend/functions/function_intelligent_rag.py

# Restart
docker restart thalamus-openwebui
```

---

## Fix Option 4: Direct Database Fix for Chat Configuration

### Force Full Context on Specific Chat

```bash
# Get chat ID from SYNAPTICA Chats folder
CHAT_ID="7b5909cb-d2a7-4236-9dbb-76d939948cb6"

# Copy DB
docker cp thalamus-openwebui:/app/backend/data/webui.db /tmp/webui.db

# Update chat to force full context
sqlite3 /tmp/webui.db << EOF
UPDATE chat 
SET chat = json_set(chat, '$.params.rag_full_context', json('true')),
    chat = json_set(chat, '$.params.top_k', 100)
WHERE id = '$CHAT_ID';
EOF

# Copy back
docker cp /tmp/webui.db thalamus-openwebui:/app/backend/data/webui.db
docker restart thalamus-openwebui
```

---

## Verification Steps

### Test 1: Check Retrieval Quality

```bash
# Query the Intelligent RAG service
curl -s "http://localhost:8765/classify?q=generate%20architecture%20diagram" | python3 -m json.tool

# Expected: Tier 3, rag_full_context=true
```

### Test 2: Verify Knowledge Base Content

```bash
# Get KB details
curl -s -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
  http://localhost:3115/api/v1/knowledge/ | python3 -c "
import sys, json
d = json.load(sys.stdin)
for kb in d.get('items', []):
    if 'SYNAPTICA' in kb['name']:
        files = kb.get('files', [])
        print(f\"{kb['name']}: {len(files)} files\")
        for f in files[:3]:
            print(f\"  - {f.get('filename')}\")
"
```

### Test 3: Manual Chat Test

1. Open http://localhost:3115
2. Go to SYNAPTICA Chats folder
3. Start new conversation
4. Check Settings (⚙️) → RAG Full Context is ON
5. Query: "List all Firestore collections from DATA_MODEL.md"
6. Verify response contains detailed schemas (not just headers)

---

## Expected Results After Fix

### Before Fix
```
Retrieved 5 sources:
1. "### SYNAPTICA Integration Points" [placeholder only]
2. "# Information Architecture" [title only]
3. "# Roadmap" [title only]
```

### After Fix
```
Retrieved 5+ sources with FULL content:
1. "### SYNAPTICA Integration Points
    Services: TenantService, AuthService...
    API Gateway: Kong with JWT validation..."
    
2. "## Firestore Collections
    tenants: {id, name, slug, status...}
    users: {id, email, tenant_id, role...}"
```

---

## Rollback

If fixes cause issues, restore from backup:

```bash
# Backup location
ls /Users/sesloan/sophia-code/tools/knowledge-sync/backups/

# Restore specific backup
docker cp /path/to/backup.db thalamus-openwebui:/app/backend/data/webui.db
docker restart thalamus-openwebui
```

---

## References

- `/docs/remediation/RAG_SYSTEM_ISSUES.md` - Full diagnostic report
- `/docs/remediation/rag_upload_script.py` - Automated upload script
- `/tools/intelligent-rag/` - Intelligent RAG service source
- `/apps/openwebui-functions/` - Open WebUI filter functions
