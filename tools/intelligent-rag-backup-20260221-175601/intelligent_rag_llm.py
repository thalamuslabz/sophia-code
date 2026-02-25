#!/usr/bin/env python3
"""
LLM-Powered Intelligent RAG Classifier

Uses a lightweight LLM via OpenRouter for more accurate query classification.
Falls back to keyword-based classification if LLM is unavailable.

Environment Variables:
    OPENROUTER_API_KEY - Your OpenRouter API key
    CLASSIFIER_MODEL - Model to use (default: google/gemini-flash-1.5)
    USE_LLM_CLASSIFIER - Enable LLM classification (default: true)
"""

import os
import json
import requests
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from intelligent_rag import QueryClassifier, QueryType, QueryClassification, TIER_CONFIGS


class LLMQueryClassifier(QueryClassifier):
    """Enhanced classifier that uses LLM for accurate query classification."""
    
    # Cheap, fast models good for classification
    DEFAULT_MODEL = "google/gemini-flash-1.5"
    FALLBACK_MODELS = [
        "openai/gpt-4o-mini",
        "anthropic/claude-3-haiku", 
        "meta-llama/llama-3.1-8b-instruct",
    ]
    
    CLASSIFICATION_PROMPT = """You are a query classification expert for a RAG (Retrieval-Augmented Generation) system.

Analyze the user query and classify it into one of three categories:

**TIER 1 - SPECIFIC_LOOKUP** (Standard RAG, TOP_K=15)
- Direct questions about specific facts, code, APIs, endpoints
- "What is X?", "How do I do Y?", "What's the function signature?"
- Debugging: "Why is this error happening?"
- Configuration: "Where is the setting for Z?"

**TIER 2 - COMPREHENSIVE_ANALYSIS** (Expanded RAG, TOP_K=50)
- Architecture questions requiring multiple documents
- "How does X connect to Y?", "Review the authentication flow"
- Design patterns, system integration questions
- Security audits, performance analysis

**TIER 3 - CREATIVE_SYNTHESIS** (Full Context, RAG_FULL_CONTEXT=True)
- Creating diagrams, documentation, proposals
- "Generate architecture diagrams", "Create comprehensive docs"
- Full system overview requests
- Anything requiring creative output across entire knowledge base

User Query: "{query}"

Respond in this exact JSON format:
{{
    "tier": 1|2|3,
    "type": "specific_lookup"|"comprehensive_analysis"|"creative_synthesis",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation of why this tier was chosen",
    "keywords_detected": ["list", "of", "key", "terms"],
    "suggests_full_context": true|false
}}

Be decisive. Most queries are Tier 1. Only choose Tier 3 for explicit creation/generation requests."""

    def __init__(self):
        super().__init__()
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = os.getenv("CLASSIFIER_MODEL", self.DEFAULT_MODEL)
        self.use_llm = os.getenv("USE_LLM_CLASSIFIER", "true").lower() == "true"
        self.llm_timeout = int(os.getenv("LLM_TIMEOUT", "5"))
        self.cost_tracking = {
            "total_calls": 0,
            "total_tokens": 0,
            "estimated_cost_usd": 0.0
        }
    
    def classify_with_llm(self, query: str) -> Optional[QueryClassification]:
        """
        Classify query using LLM for higher accuracy.
        
        Returns None if LLM classification fails.
        """
        if not self.api_key or not self.use_llm:
            return None
        
        models_to_try = [self.model] + self.FALLBACK_MODELS
        
        for model in models_to_try:
            try:
                result = self._call_llm(query, model)
                if result:
                    return result
            except Exception as e:
                print(f"[LLMClassifier] {model} failed: {e}")
                continue
        
        return None
    
    def _call_llm(self, query: str, model: str) -> Optional[QueryClassification]:
        """Call OpenRouter API for classification."""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/thalamus-ai/sophia-code",
            "X-Title": "Intelligent RAG Classifier"
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": self.CLASSIFICATION_PROMPT.format(query=query)
                }
            ],
            "temperature": 0.1,  # Low temperature for consistent classification
            "max_tokens": 200,
            "response_format": {"type": "json_object"}
        }
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=self.llm_timeout
        )
        response.raise_for_status()
        
        data = response.json()
        
        # Track costs (approximate)
        usage = data.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        total_tokens = prompt_tokens + completion_tokens
        
        # Rough cost estimate (varies by model)
        cost_per_1k = 0.00015  # Average for flash/mini models
        estimated_cost = (total_tokens / 1000) * cost_per_1k
        
        self.cost_tracking["total_calls"] += 1
        self.cost_tracking["total_tokens"] += total_tokens
        self.cost_tracking["estimated_cost_usd"] += estimated_cost
        
        # Parse response
        content = data["choices"][0]["message"]["content"]
        result = json.loads(content)
        
        tier = result.get("tier", 1)
        query_type_str = result.get("type", "specific_lookup")
        
        # Map string to enum
        type_mapping = {
            "specific_lookup": QueryType.SPECIFIC_LOOKUP,
            "comprehensive_analysis": QueryType.COMPREHENSIVE_ANALYSIS,
            "creative_synthesis": QueryType.CREATIVE_SYNTHESIS
        }
        query_type = type_mapping.get(query_type_str, QueryType.SPECIFIC_LOOKUP)
        
        return QueryClassification(
            query_type=query_type,
            confidence=result.get("confidence", 0.8),
            reasoning=f"[LLM] {result.get('reasoning', 'Classified by LLM')}",
            recommended_tier=tier,
            rag_full_context=tier == 3 or result.get("suggests_full_context", False),
            top_k=TIER_CONFIGS[tier].top_k
        )
    
    def classify(self, query: str) -> QueryClassification:
        """
        Classify query using LLM first, fall back to keyword-based.
        
        This ensures we get accurate classification even if it costs
        a few pennies - much cheaper than wasting tokens on wrong context.
        """
        # Try LLM classification first
        llm_result = self.classify_with_llm(query)
        
        if llm_result:
            print(f"[LLMClassifier] Used LLM for classification")
            print(f"[LLMClassifier] Total calls: {self.cost_tracking['total_calls']}, "
                  f"Est. cost: ${self.cost_tracking['estimated_cost_usd']:.4f}")
            return llm_result
        
        # Fall back to keyword-based classification
        print(f"[LLMClassifier] Falling back to keyword classification")
        return super().classify(query)
    
    def get_cost_report(self) -> Dict:
        """Get cost tracking report."""
        return {
            **self.cost_tracking,
            "average_cost_per_call": (
                self.cost_tracking["estimated_cost_usd"] / max(self.cost_tracking["total_calls"], 1)
            )
        }


class HybridClassifier:
    """
    Hybrid classifier that intelligently chooses between LLM and keyword methods.
    
    Strategy:
    - Use keyword for obvious cases (high confidence)
    - Use LLM for ambiguous cases (medium confidence)
    - Cache results to avoid repeated LLM calls
    """
    
    def __init__(self):
        self.keyword_classifier = QueryClassifier()
        self.llm_classifier = LLMQueryClassifier()
        self.cache: Dict[str, QueryClassification] = {}
        self.llm_threshold = float(os.getenv("LLM_CONFIDENCE_THRESHOLD", "0.7"))
    
    def classify(self, query: str) -> QueryClassification:
        """Classify with smart method selection."""
        
        # Check cache
        if query in self.cache:
            print(f"[HybridClassifier] Cache hit")
            return self.cache[query]
        
        # First, try keyword classification
        keyword_result = self.keyword_classifier.classify(query)
        
        # If keyword confidence is high, use it (saves money)
        if keyword_result.confidence >= self.llm_threshold:
            print(f"[HybridClassifier] Using keyword classification (confidence: {keyword_result.confidence:.2f})")
            self.cache[query] = keyword_result
            return keyword_result
        
        # Otherwise, use LLM for better accuracy
        print(f"[HybridClassifier] Keyword confidence low ({keyword_result.confidence:.2f}), using LLM")
        llm_result = self.llm_classifier.classify_with_llm(query)
        
        if llm_result:
            self.cache[query] = llm_result
            return llm_result
        
        # Fall back to keyword if LLM fails
        self.cache[query] = keyword_result
        return keyword_result


# Standalone test
if __name__ == "__main__":
    import sys
    
    # Check for API key
    if not os.getenv("OPENROUTER_API_KEY"):
        print("Warning: OPENROUTER_API_KEY not set. Using keyword classification only.")
        print("Set it to enable LLM-powered classification.\n")
    
    classifier = HybridClassifier()
    
    # Test queries
    test_queries = [
        "What's the auth endpoint?",
        "How do I configure the database connection?",
        "Review the complete authentication architecture",
        "Create a full architecture diagram package",
        "What is the function signature for createUser?",
        "How does Service A connect to Service B?",
        "Generate comprehensive documentation",
        "Debug this error: Connection refused",
    ]
    
    print("=" * 70)
    print("LLM-Powered Intelligent RAG Classifier Test")
    print("=" * 70)
    
    for query in test_queries:
        result = classifier.classify(query)
        print(f"\nQuery: {query}")
        print(f"  Type: {result.query_type.value}")
        print(f"  Tier: {result.recommended_tier}")
        print(f"  Confidence: {result.confidence:.0%}")
        print(f"  Full Context: {result.rag_full_context}")
        print(f"  Reason: {result.reasoning[:80]}...")
    
    # Print cost report
    if hasattr(classifier.llm_classifier, 'get_cost_report'):
        print("\n" + "=" * 70)
        print("Cost Report")
        print("=" * 70)
        report = classifier.llm_classifier.get_cost_report()
        print(f"Total LLM calls: {report['total_calls']}")
        print(f"Total tokens: {report['total_tokens']}")
        print(f"Estimated cost: ${report['estimated_cost_usd']:.4f} USD")
        print(f"Average per call: ${report['average_cost_per_call']:.6f} USD")
