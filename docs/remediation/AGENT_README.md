# RAG Remediation Agent - Quick Start

**Your Mission**: Fix the Open WebUI RAG system to deliver full document context instead of just headers.

---

## 🎯 Problem in 30 Seconds

Users ask: *"Generate architecture diagram for SYNAPTICA"*  
System retrieves: *Document titles and headers only*  
Should retrieve: *Full technical specifications, schemas, APIs*

The Intelligent RAG correctly classifies the query as **Tier 3 (Creative Synthesis)** with `RAG_FULL_CONTEXT=True`, but Open WebUI's RAG layer isn't respecting this setting.

---

## 📁 Files You Need to Read

1. **`RAG_SYSTEM_ISSUES.md`** - Full diagnostic report
2. **`RAG_FIX_INSTRUCTIONS.md`** - Step-by-step fix procedures
3. **`rag_upload_script.py`** - Automated upload tool

---

## 🔧 Quick Fixes to Try (In Order)

### Fix #1: Admin Settings (2 minutes)

```bash
export OPEN_WEBUI_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkYzFlM2U1LWY1ZGYtNDY3Yy1hNjRlLTgyYzYwN2I1MmNmMCIsImV4cCI6MTc3NDEzNTE1MCwianRpIjoiZWM4ODQ0NTUtMjdiZS00OTM0LTliY2UtZGQzOTgxM2IyZTZmIn0.NUwsNr1ctBefFb-c4w8UP04uycinoDxui0paa6RWlT8"

# Update RAG settings via API
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

### Fix #2: Re-upload with Script (10 minutes)

```bash
cd /Users/sesloan/sophia-code/docs/remediation
python3 rag_upload_script.py --configure
python3 rag_upload_script.py --sync-all
```

### Fix #3: Manual Web UI Configuration (5 minutes)

1. Open http://localhost:3115
2. Admin Panel → Settings → RAG
3. Set:
   - **Chunk Size**: 4000
   - **Chunk Overlap**: 200
   - **Enable RAG Full Context**: ✅ ON
   - **Max Context Window**: 50000
4. Save and restart Open WebUI container

---

## ✅ Verification

After fixes, test with:

```bash
# Verify Intelligent RAG is working
curl -s "http://localhost:8765/classify?q=generate%20architecture" | python3 -m json.tool

# Should show:
# "recommended_tier": 3
# "rag_full_context": true
```

Then in Open WebUI:
1. Go to SYNAPTICA Chats
2. Start new conversation
3. Ask: *"What are the Firestore collections in DATA_MODEL.md?"*
4. Verify response contains detailed schemas (not just headers)

---

## 🚨 If Nothing Works

### Nuclear Option: Reset and Manual Upload

```bash
# 1. Backup current state
docker cp thalamus-openwebui:/app/backend/data/webui.db /tmp/webui-backup-$(date +%Y%m%d).db

# 2. Reset knowledge bases (see RAG_FIX_INSTRUCTIONS.md)
# 3. Use Open WebUI web interface to manually upload files
# 4. Enable RAG Full Context in each chat's settings
```

---

## 📞 Key Information

| Service | URL | Status Check |
|---------|-----|--------------|
| Open WebUI | http://localhost:3115 | `curl http://localhost:3115/health` |
| Intelligent RAG | http://localhost:8765 | `curl http://localhost:8765/health` |
| Qdrant | http://localhost:6333 | `curl http://localhost:6333/healthz` |

**API Key**: Available in `$OPEN_WEBUI_API_KEY`

**Knowledge Base IDs**: Get with:
```bash
curl -s -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
  http://localhost:3115/api/v1/knowledge/ | python3 -c "
import sys, json
d = json.load(sys.stdin)
for kb in d.get('items', []):
    print(f\"{kb['name']}: {kb['id']}\")
"
```

---

## 🔍 Debugging Commands

```bash
# Check container logs
docker logs thalamus-openwebui --tail 50

# Check Intelligent RAG classification
curl -s "http://localhost:8765/classify?q=your%20query%20here"

# List all knowledge bases
curl -s -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
  http://localhost:3115/api/v1/knowledge/ | python3 -m json.tool

# Check file count in KB
curl -s -H "Authorization: Bearer $OPEN_WEBUI_API_KEY" \
  http://localhost:3115/api/v1/knowledge/{KB_ID} | python3 -c "
import sys, json
d = json.load(sys.stdin)
files = d.get('files', [])
print(f'Files: {len(files)}')
for f in files[:5]:
    print(f\"  - {f.get('filename')}\")
"
```

---

## 🎯 Success Criteria

✅ **Fixed** when:
- Query "generate architecture diagram" retrieves 5+ full documents
- Each source contains detailed technical content (not just headers)
- LLM can generate comprehensive diagrams from the context
- Response cites specific sections from DATA_MODEL.md, SYSTEM_ARCHITECTURE.md, etc.

---

## 📚 Full Documentation

- `/docs/remediation/RAG_SYSTEM_ISSUES.md` - Diagnostic report
- `/docs/remediation/RAG_FIX_INSTRUCTIONS.md` - Detailed fix procedures
- `/docs/remediation/rag_upload_script.py` - Automated upload tool

---

**Good luck, agent! The RAG system needs you.** 🚀
