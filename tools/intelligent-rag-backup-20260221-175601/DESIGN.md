# Intelligent Adaptive Context Management for Open WebUI

> **Implementation Status**: ✅ **COMPLETE**
> 
> This design has been fully implemented. See the [README.md](README.md) for usage instructions.
> 
> **Quick Start**: `cd tools/intelligent-rag && ./install.sh && rag-cli start`

## Problem Statement

Current RAG systems use a one-size-fits-all approach:
- **Chunked RAG**: Cost-effective but misses cross-document context
- **Full Context**: Comprehensive but token-prohibitive for every query

**Goal**: Intelligently determine context depth based on query type

---

## Solution: Multi-Tier Context Strategy

### Tier 1: Standard Queries (Default)
- **Method**: Chunked RAG with TOP_K=15
- **Use for**: Specific questions, lookups, code examples
- **Example**: "What's the API endpoint for user authentication?"

### Tier 2: Comprehensive Analysis
- **Method**: Full document retrieval for specific files
- **Use for**: Architecture questions, design decisions, integration planning
- **Example**: "Review the complete authentication architecture"

### Tier 3: Full Knowledge Base
- **Method**: RAG_FULL_CONTEXT=True
- **Use for**: Initial architecture, complete system understanding
- **Example**: "Create a full architecture diagram package"

---

## Implementation Approaches

### Approach 1: Query Classification via System Prompt (Recommended)

Add a system prompt that detects query type and self-adjusts:

```
You are an intelligent assistant with access to a knowledge base.

CONTEXT MANAGEMENT PROTOCOL:

Before answering, classify the user query:

1. SPECIFIC_LOOKUP: Asking for specific facts, code, endpoints
   → Use provided RAG context (chunks)
   
2. COMPREHENSIVE_ANALYSIS: Asking for architecture, design, patterns
   → Request full documents from knowledge base
   
3. CREATIVE_SYNTHESIS: Creating diagrams, proposals, documentation
   → Request COMPLETE knowledge base context

If classification is COMPREHENSIVE_ANALYSIS or CREATIVE_SYNTHESIS,
respond with: [REQUEST_FULL_CONTEXT] followed by your reasoning.

Otherwise, answer using the provided RAG context.
```

**How it works**:
1. User asks for architecture diagrams
2. Model outputs: `[REQUEST_FULL_CONTEXT] This query requires understanding the complete system architecture across all documents...`
3. Function intercepts this, enables RAG_FULL_CONTEXT for this query
4. Re-run with full context

---

### Approach 2: Open WebUI Functions

Create a custom function that:
1. Analyzes the query intent
2. Adjusts RAG settings dynamically
3. Maintains conversation memory

**File**: `/functions/Intelligent_RAG.py`

```python
class Pipe:
    def __init__(self):
        self.type = "pipe"
        self.id = "intelligent-rag"
        self.name = "Intelligent RAG"
        
    async def pipe(self, body: dict, __user__: dict):
        """
        Analyze query and adjust context strategy
        """
        messages = body.get("messages", [])
        last_message = messages[-1]["content"] if messages else ""
        
        # Classify query
        classification = self.classify_query(last_message)
        
        # Adjust RAG settings based on classification
        if classification == "COMPREHENSIVE":
            # Modify body to use full context
            body["features"]["rag_config"] = {
                "RAG_FULL_CONTEXT": True,
                "TOP_K": 50
            }
        
        return body
    
    def classify_query(self, query: str) -> str:
        """Classify query type"""
        comprehensive_keywords = [
            "architecture", "diagram", "full", "complete", 
            "comprehensive", "overview", "system design",
            "create", "generate", "package"
        ]
        
        lookup_keywords = [
            "what is", "how to", "endpoint", "api", 
            "function", "method", "specific"
        ]
        
        query_lower = query.lower()
        
        comp_score = sum(1 for k in comprehensive_keywords if k in query_lower)
        lookup_score = sum(1 for k in lookup_keywords if k in query_lower)
        
        if comp_score > lookup_score:
            return "COMPREHENSIVE"
        return "STANDARD"
```

---

### Approach 3: Hybrid Memory + RAG System

**Architecture**:

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
│            ┌──────────────┐                                  │
│            │   Memory     │                                  │
│            │   Layer      │                                  │
│            │              │                                  │
│            │  • Key facts  │                                  │
│            │  • Decisions  │                                  │
│            │  • Context    │                                  │
│            └──────────────┘                                  │
│                    │                                         │
│                    ▼                                         │
│              ┌──────────┐                                    │
│              │  LLM     │                                    │
│              │ Response │                                    │
│              └──────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommended Implementation

### Phase 1: Simple Query Classification (Now)

Update the **RAG_TEMPLATE** in Open WebUI:

```python
# Current template (simplified)
RAG_TEMPLATE = """
Respond to the user query using the provided context.

<context>
{{CONTEXT}}
</context>
"""

# New template with self-classification
RAG_TEMPLATE = """
CONTEXT MANAGEMENT PROTOCOL:

Analyze the user query and classify as:
- [STANDARD]: Specific lookup, code example, single fact
- [COMPREHENSIVE]: Architecture, design, integration, requires multiple docs

If [COMPREHENSIVE], state this clearly and explain what additional context is needed.

<context>
{{CONTEXT}}
</context>

User Query: {{QUERY}}

Classification: 
"""
```

### Phase 2: Automatic Full-Context Trigger (Next)

Create an Open WebUI Function that:
1. Intercepts model output
2. Detects `[REQUEST_FULL_CONTEXT]` or similar markers
3. Re-runs query with `RAG_FULL_CONTEXT=True`
4. Maintains conversation flow

### Phase 3: Persistent Memory Layer (Future)

Implement conversation memory:
- Store key facts, decisions, architecture insights
- Reference memory in subsequent queries
- Reduce redundant full-context retrieval

---

## Configuration Updates

### Option 1: For Architecture Work (Immediate)

Set `RAG_FULL_CONTEXT=True` when working on:
- Initial architecture design
- Creating comprehensive documentation
- System integration planning
- Security audits

Trade-off: Higher token cost, but complete accuracy

### Option 2: Hybrid Approach (Recommended)

Create multiple "personas" or models in Open WebUI:

**Model: Standard Assistant**
- RAG_FULL_CONTEXT: False
- TOP_K: 15
- Use for: Daily queries, specific lookups

**Model: Architecture Assistant**  
- RAG_FULL_CONTEXT: True
- TOP_K: 50
- Use for: Diagrams, architecture, comprehensive docs

**Model: Code Assistant**
- RAG_FULL_CONTEXT: False
- TOP_K: 10
- Use for: Code review, implementation details

---

## Metrics to Monitor

1. **Context Coverage**: % of KB files used in response
2. **Token Efficiency**: Cost per query by classification
3. **Accuracy**: Rate of hallucinations vs comprehensive queries
4. **User Override**: How often users need to ask for "more context"

---

## Decision Matrix

| Query Type | Example | Recommended Strategy |
|------------|---------|---------------------|
| Lookup | "What's the auth endpoint?" | Chunked RAG |
| Tutorial | "How do I implement OAuth?" | Chunked RAG + specific docs |
| Architecture | "Design the data flow" | Full Context |
| Integration | "How does Service A connect to B?" | Full Context |
| Review | "Review this architecture" | Full Context |
| Creative | "Create documentation" | Full Context |
| Debug | "Why is this failing?" | Chunked RAG + logs |

---

## Next Steps

1. **Immediate**: Set `RAG_FULL_CONTEXT=True` for architecture work
2. **Short-term**: Create multiple model presets (Standard, Architecture, Code)
3. **Medium-term**: Implement query classification function
4. **Long-term**: Build persistent memory layer

Which approach would you like to implement first?
