"""
Intelligent Adaptive RAG System

A multi-tier context management system for Open WebUI that dynamically
determines the appropriate RAG strategy based on query classification.

Usage:
    from intelligent_rag import QueryClassifier, QueryType
    
    classifier = QueryClassifier()
    result = classifier.classify("What's the auth endpoint?")
    print(f"Tier: {result.recommended_tier}")
"""

from .intelligent_rag import (
    QueryClassifier,
    QueryType,
    QueryClassification,
    RAGConfig,
    RAGResponseHandler,
    IntelligentRAGServer,
    TIER_CONFIGS,
)

__version__ = "1.0.0"
__all__ = [
    "QueryClassifier",
    "QueryType", 
    "QueryClassification",
    "RAGConfig",
    "RAGResponseHandler",
    "IntelligentRAGServer",
    "TIER_CONFIGS",
]
