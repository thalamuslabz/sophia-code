# Qdrant Integration

**Semantic search across your entire knowledge base.**

---

## Overview

Qdrant provides vector search capabilities:

- **Semantic search** across Obsidian vault
- **Code search** using natural language
- **Evidence discovery** by meaning
- **Related content** suggestions

```
Query: "authentication implementation"
    ↓
Vector embedding
    ↓
Qdrant search
    ↓
Results:
  - Obsidian note: "JWT Auth Pattern"
  - Code: src/auth/login.ts
  - Evidence: intent-001 build
  - Intent: "Add user auth"
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  DATA SOURCES                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Obsidian │ │   Code   │ │ Evidence │ │ Intents  │  │
│  │   Vault  │ │   Repos  │ │  Files   │ │ History  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │            │            │            │          │
│       └────────────┴────────────┴────────────┘          │
│                    │                                     │
│              ┌─────┴─────┐                               │
│              │  Chunk &  │                               │
│              │  Embed    │                               │
│              └─────┬─────┘                               │
│                    │                                     │
├────────────────────┼────────────────────────────────────┤
│                    ▼                                     │
│              ┌──────────┐                                │
│              │  Qdrant  │  Vector Database               │
│              │  :6333   │  - Collections                 │
│              └──────────┘  - Semantic search             │
│                            - Similarity scoring          │
├─────────────────────────────────────────────────────────┤
│  SEARCH INTERFACE                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Open WebUI  │  │   n8n Flow   │  │    CLI       │  │
│  │  /search     │  │   Webhooks   │  │  qdrant-sync │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Collections

| Collection | Content | Update Frequency |
|------------|---------|------------------|
| `obsidian-vault` | Documentation | Every 6 hours |
| `code-repos` | Source code | On commit |
| `build-evidence` | Build outputs | On completion |
| `intents` | Intent history | On creation |

---

## Setup

Qdrant starts automatically with Docker Compose:

```bash
docker compose up -d qdrant
```

Access:
- API: http://localhost:6333
- Dashboard: http://localhost:6333/dashboard

---

## Usage

### Via Open WebUI

```
User: /search authentication patterns

AI: Found 5 relevant documents:
     1. JWT Authentication (Obsidian) - 0.95
     2. src/auth/login.ts (Code) - 0.92
     3. Intent: Add OAuth (History) - 0.89
     ...
```

### Via CLI

```bash
# Sync vault to Qdrant
qdrant-sync vault --collection obsidian-vault

# Search
qdrant-sync search "authentication" --limit 10

# Query specific collection
qdrant-sync search "API design" --collection code-repos
```

### Via API

```typescript
import { QdrantSync } from '@thalamus/qdrant-sync';

const qdrant = new QdrantSync({
  url: 'http://localhost:6333'
});

// Generate embedding
const vector = await qdrant.generateEmbedding(
  "authentication patterns"
);

// Search
const results = await qdrant.search('obsidian-vault', vector, {
  limit: 5,
  filter: { project: 'sophia' }
});

// Results include:
// - Content snippets
// - Source files
// - Similarity scores
// - Metadata
```

---

## Embedding Generation

Uses local Ollama (included in stack):

```bash
# Default model: all-minilm (384 dimensions)
# Fast, lightweight, good for documentation

# Pull model
docker exec ops-ollama ollama pull all-minilm

# Or use nomic-embed-text for better quality
docker exec ops-ollama ollama pull nomic-embed-text
```

Configure in `packages/qdrant-sync/src/core/qdrant-client.ts`:

```typescript
const embedding = await qdrant.generateEmbedding(
  text,
  'nomic-embed-text'  // Alternative model
);
```

---

## Chunking Strategy

Documents are split for better search:

```
Document: "Long markdown content..."
    ↓
Chunk 1: First 500 chars + 100 overlap
Chunk 2: Next 500 chars + 100 overlap
Chunk 3: ...
    ↓
Each chunk embedded separately
```

**Why chunk?**
- Precise matching
- Better context
- Reduced noise

---

## Search Examples

### Find Similar Code

```typescript
// Query with code snippet
const results = await qdrant.search('code-repos', vector, {
  filter: { type: 'typescript' },
  limit: 3
});
```

### Find Related Documentation

```typescript
// Search across vault
const results = await qdrant.searchAll(vector, {
  limit: 5,
  scoreThreshold: 0.8
});
```

### Filter by Project

```typescript
// Only sophia project docs
const results = await qdrant.search('obsidian-vault', vector, {
  filter: {
    must: [
      { key: 'project', match: { value: 'sophia' } }
    ]
  }
});
```

---

## Integration with n8n

Import workflow:

```bash
# In n8n (http://localhost:3118)
# Workflows → Import
# Select: apps/n8n-workflows/vault-qdrant-sync.json
```

The workflow:
1. Runs every 6 hours (or manual trigger)
2. Scans Obsidian vault
3. Chunks documents
4. Generates embeddings via Ollama
5. Stores in Qdrant

---

## CLI Commands

```bash
# Initialize collections
qdrant-sync init

# Full vault sync
qdrant-sync sync-vault ~/Documents/Obsidian\ Vault

# Sync specific file
qdrant-sync sync-file note.md --collection obsidian-vault

# Search
qdrant-sync query "deployment patterns"

# Get stats
qdrant-sync stats

# Delete collection
qdrant-sync delete-collection obsidian-vault
```

---

## Dashboard

Qdrant includes a web UI for:

- Collection overview
- Point inspection
- Test queries
- Performance metrics

Access: http://localhost:6333/dashboard

---

## Performance

| Metric | Value |
|--------|-------|
| Indexing | ~100 docs/minute |
| Search latency | <50ms |
| Memory | ~1GB per 100k points |
| Embedding time | ~100ms per chunk |

---

**Find anything, instantly, by meaning. 🔍✨**
