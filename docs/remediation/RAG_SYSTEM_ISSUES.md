# RAG System Issues - Diagnostic Report

**Date**: 2026-02-21  
**Status**: Partially Working - Requires Configuration Fix  
**Priority**: High

---

## Executive Summary

The Intelligent RAG system is **functionally operational** but not delivering full document context to chats. Files are properly uploaded and indexed, but the RAG retrieval is only returning **document headers/overview sections** instead of the full technical content needed for comprehensive responses.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTELLIGENT RAG FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User Query                                                      │
│      ↓                                                           │
│  [Intelligent RAG Filter] ──classifies──→ Tier 3 (Creative)     │
│      ↓                                      RAG_FULL_CONTEXT=True │
│  [Open WebUI RAG Layer] ◄────PROBLEM────┘                        │
│      ↓                                                           │
│  [Vector Search] → Returns chunks (not respecting filter)       │
│      ↓                                                           │
│  [LLM] Receives only header chunks                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Issue #1: Filter-Retrieval Timing Gap

### Problem
The Intelligent RAG filter modifies `body['knowledge']['rag_full_context'] = True`, but Open WebUI's RAG retrieval layer processes the vector search **independently** of these filter modifications.

### Evidence
```json
// Filter correctly sets these values
{
  "classification": {
    "type": "creative_synthesis",
    "recommended_tier": 3,
    "rag_full_context": true,
    "top_k": 100,
    "confidence": 0.8
  }
}
```

But the chat still receives:
- Only 5 sources
- First chunk of each document (headers only)
- Missing: detailed architecture, schemas, API specs

### Root Cause
Open WebUI's RAG pipeline queries the vector database **before** or **independently** of the filter's inlet processing.

---

## Issue #2: Chunking Strategy

### Problem
Documents are chunked at the ingestion stage with small chunk sizes, causing:
- Headers in chunk 1
- Detailed content in chunks 2-N
- RAG only retrieves chunk 1 for each document

### Evidence
```python
# Retrieved content shows only:
"### SYNAPTICA Integration Points\n- [Services involved]\n- [API dependencies]"

# Missing from retrieval:
"## Firestore Collections\n### tenants\n{ id, name, slug, status... }"
```

---

## Issue #3: Knowledge Base Assignment

### Problem
Chats don't have explicit knowledge base assignments in metadata.

### Current State
```sql
-- Chat meta shows:
{ "tags": ["technology", "software_architecture"] }

-- Missing:
{ "knowledge": ["kb-id-1", "kb-id-2"] }
```

---

## Affected Components

| Component | Status | Issue |
|-----------|--------|-------|
| Intelligent RAG Service (port 8765) | ✅ Working | Correctly classifies queries |
| Open WebUI Filter Function | ✅ Active | Correctly modifies request body |
| Vector Database (Qdrant) | ✅ Healthy | 6 collections, all operational |
| File Upload/Processing | ✅ Working | 44 files in SYNAPTICA Production |
| RAG Retrieval Layer | ❌ Broken | Not respecting filter settings |
| Chunking Configuration | ⚠️ Suboptimal | Chunks too small, headers separate |

---

## Files Available (SYNAPTICA Production)

All files have FULL content but only headers are retrieved:

| File | Size | Content Type |
|------|------|--------------|
| SYSTEM_ARCHITECTURE.md | 16KB | Full system architecture |
| DATA_MODEL.md | 11KB | Firestore schemas, collections |
| API_SPECIFICATION.md | 11KB | API endpoints, specs |
| TECHNICAL_REQUIREMENTS.md | 10KB | Technical requirements |
| INTEGRATION_REQUIREMENTS.md | 6.7KB | External integrations |
| SECURITY_ARCHITECTURE.md | 5.9KB | Security model |
| + 38 more files | Various | Product, operations, content docs |

**Total**: 44 files, ~300KB of documentation

---

## Services Status

| Service | Endpoint | Status |
|---------|----------|--------|
| Open WebUI | http://localhost:3115 | ✅ Healthy |
| Intelligent RAG | http://localhost:8765 | ✅ Healthy |
| Qdrant | http://localhost:6333 | ✅ Healthy |
| n8n | http://localhost:3118 | ✅ Healthy |
| Repo-Obsidian Sync | LaunchAgent | ✅ Running |

---

## API Keys Available

```bash
# Open WebUI (for API calls)
export OPEN_WEBUI_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkYzFlM2U1LWY1ZGYtNDY3Yy1hNjRlLTgyYzYwN2I1MmNmMCIsImV4cCI6MTc3NDEzNTE1MCwianRpIjoiZWM4ODQ0NTUtMjdiZS00OTM0LTliY2UtZGQzOTgxM2IyZTZmIn0.NUwsNr1ctBefFb-c4w8UP04uycinoDxui0paa6RWlT8"
```

---

## Related Files

- `/tools/intelligent-rag/intelligent_rag.py` - Classification service
- `/tools/intelligent-rag/intelligent_rag_llm.py` - LLM integration
- `/apps/openwebui-functions/function_intelligent_rag.py` - Open WebUI filter
- `/docs/remediation/RAG_FIX_INSTRUCTIONS.md` - Fix procedures (see next file)
