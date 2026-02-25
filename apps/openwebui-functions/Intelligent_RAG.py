"""
Intelligent RAG Function for Open WebUI

title: Intelligent RAG
author: Sophia Code
author_url: https://github.com/thalamus-ai/sophia-code
version: 2.0.0
required_open_webui_version: 0.5.0

A function that intelligently determines context depth based on query classification.
Uses x-ai/grok-4.1-fast via OpenRouter for high-accuracy classification.

Environment Variables:
- INTELLIGENT_RAG_URL: URL of the intelligent RAG classifier service
                       (default: http://localhost:8765)
- OPENROUTER_API_KEY: (optional) For direct LLM classification in function
"""

import os
import json
import re
from typing import Dict, List, Optional, Callable, Any, Tuple
from pydantic import BaseModel, Field
import requests


class Filter:
    """Open WebUI Function Filter for Intelligent RAG."""
    
    class Valves(BaseModel):
        """Configuration valves for the filter."""
        enabled: bool = Field(
            default=True,
            description="Enable intelligent RAG classification"
        )
        classifier_url: str = Field(
            default="http://localhost:8765",
            description="URL of the intelligent RAG classifier service"
        )
        auto_reroll: bool = Field(
            default=True,
            description="Automatically reroll with full context when requested"
        )
        verbose: bool = Field(
            default=True,
            description="Show classification details in response"
        )
        # Tier thresholds
        tier1_top_k: int = Field(default=15, description="TOP_K for Tier 1 queries")
        tier2_top_k: int = Field(default=50, description="TOP_K for Tier 2 queries")
        tier3_top_k: int = Field(default=100, description="TOP_K for Tier 3 queries")
        # Direct LLM fallback
        use_direct_llm: bool = Field(
            default=True,
            description="Use direct LLM call if classifier service is unavailable"
        )
        openrouter_api_key: str = Field(
            default="",
            description="OpenRouter API key (or set OPENROUTER_API_KEY env var)"
        )
        llm_model: str = Field(
            default="x-ai/grok-4.1-fast",
            description="Model for direct LLM classification"
        )
    
    def __init__(self):
        self.valves = self.Valves()
        self.classifier_url = os.getenv("INTELLIGENT_RAG_URL", self.valves.classifier_url)
        self.api_key = self.valves.openrouter_api_key or os.getenv("OPENROUTER_API_KEY", "")
        self.classification_cache: Dict[str, Dict] = {}
        self.full_context_marker = "[REQUEST_FULL_CONTEXT]"
    
    def classify_query(self, query: str) -> Optional[Dict]:
        """Classify query using the intelligent RAG service."""
        try:
            # Check cache first
            if query in self.classification_cache:
                return self.classification_cache[query]
            
            response = requests.post(
                f"{self.classifier_url}/classify",
                json={"query": query},
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            # Cache result
            self.classification_cache[query] = result
            return result
            
        except Exception as e:
            if self.valves.verbose:
                print(f"[IntelligentRAG] Service error: {e}")
            
            # Fall back to direct LLM if enabled
            if self.valves.use_direct_llm and self.api_key:
                return self.classify_with_direct_llm(query)
            
            return None
    
    def classify_with_direct_llm(self, query: str) -> Optional[Dict]:
        """Direct LLM classification via OpenRouter as fallback."""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/thalamus-ai/sophia-code",
                "X-Title": "Intelligent RAG - Open WebUI"
            }
            
            prompt = f"""Classify this query for a RAG system:

Query: "{query}"

Tiers:
1. SPECIFIC_LOOKUP - Direct questions, code, APIs (TOP_K=15)
2. COMPREHENSIVE_ANALYSIS - Architecture, integration (TOP_K=50)
3. CREATIVE_SYNTHESIS - Create docs, diagrams (RAG_FULL_CONTEXT=True)

Respond with JSON: {{"tier": 1|2|3, "type": "...", "confidence": 0.0-1.0, "reasoning": "..."}}"""
            
            payload = {
                "model": self.valves.llm_model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 150,
                "response_format": {"type": "json_object"}
            }
            
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            content = data["choices"][0]["message"]["content"]
            llm_result = json.loads(content)
            
            tier = llm_result.get("tier", 1)
            tier_config = {
                1: {"rag_full_context": False, "top_k": self.valves.tier1_top_k},
                2: {"rag_full_context": False, "top_k": self.valves.tier2_top_k},
                3: {"rag_full_context": True, "top_k": self.valves.tier3_top_k}
            }
            config = tier_config.get(tier, tier_config[1])
            
            result = {
                "query": query,
                "classification": {
                    "tier": tier,
                    "type": llm_result.get("type", "specific_lookup"),
                    "confidence": llm_result.get("confidence", 0.8),
                    "reasoning": f"[Direct LLM - {self.valves.llm_model}] {llm_result.get('reasoning', '')}",
                    **config
                },
                "source": "direct_llm"
            }
            
            self.classification_cache[query] = result
            return result
            
        except Exception as e:
            if self.valves.verbose:
                print(f"[IntelligentRAG] Direct LLM error: {e}")
            return None
    
    def check_response_for_full_context(self, response: str, rag_config: Dict) -> Tuple[bool, str]:
        """Check if response contains a full context request marker."""
        if self.full_context_marker in response:
            parts = response.split(self.full_context_marker, 1)
            reasoning = parts[1].strip() if len(parts) > 1 else "Full context requested by model"
            return True, reasoning
        return False, ""
    
    def get_system_prompt_addition(self, classification: Dict) -> str:
        """Get system prompt addition based on classification."""
        tier = classification.get("tier", 1)
        
        additions = {
            1: """
[Context: Standard Query]
Use the provided RAG context chunks to answer the specific question.
Focus on extracting the exact information requested.
""",
            2: """
[Context: Comprehensive Analysis]
This query requires understanding across multiple documents.
If the provided chunks are insufficient, include [REQUEST_FULL_CONTEXT] in your response
followed by an explanation of what additional context is needed.
""",
            3: """
[Context: Full Knowledge Base]
This query requires complete knowledge base context.
Comprehensive access has been enabled - use all available context.
If still insufficient, include [REQUEST_FULL_CONTEXT] and explain.
"""
        }
        
        return additions.get(tier, additions[1])
    
    def inlet(self, body: Dict, __user__: Optional[Dict] = None) -> Dict:
        """
        Process incoming request before sending to LLM.
        Classify query and adjust RAG settings.
        """
        if not self.valves.enabled:
            return body
        
        # Extract the last user message
        messages = body.get("messages", [])
        last_message = None
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_message = msg.get("content", "")
                break
        
        if not last_message:
            return body
        
        # Classify the query
        classification_data = self.classify_query(last_message)
        
        if classification_data:
            classification = classification_data.get("classification", {})
            tier = classification.get("tier", 1)
            query_type = classification.get("type", "specific_lookup")
            confidence = classification.get("confidence", 0.8)
            
            # Store classification in metadata
            if "metadata" not in body:
                body["metadata"] = {}
            body["metadata"]["intelligent_rag"] = {
                "classification": classification,
                "query": last_message[:100]
            }
            
            # Adjust RAG settings
            if "features" not in body:
                body["features"] = {}
            if "web_search" not in body["features"]:
                body["features"]["web_search"] = {}
            
            # Map tiers to TOP_K values
            top_k_map = {
                1: self.valves.tier1_top_k,
                2: self.valves.tier2_top_k,
                3: self.valves.tier3_top_k
            }
            
            new_top_k = top_k_map.get(tier, self.valves.tier1_top_k)
            body["features"]["web_search"]["top_k"] = new_top_k
            
            # For Tier 3, enable full context
            if tier == 3:
                body["features"]["web_search"]["rag_full_context"] = True
                
                # FIX: Also inject into knowledge section for Open WebUI RAG layer
                # This ensures the RAG retrieval layer respects the full context setting
                if "knowledge" not in body:
                    body["knowledge"] = {}
                body["knowledge"]["rag_full_context"] = True
                body["knowledge"]["top_k"] = new_top_k
                
                # Also inject into params if present (alternative location)
                if "params" not in body:
                    body["params"] = {}
                body["params"]["rag_full_context"] = True
                body["params"]["top_k"] = new_top_k
            
            # Add system message with classification guidance
            system_addition = self.get_system_prompt_addition(classification)
            
            # Find or create system message
            system_msg_idx = None
            for i, msg in enumerate(messages):
                if msg.get("role") == "system":
                    system_msg_idx = i
                    break
            
            context_note = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 INTELLIGENT RAG CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query Type: {query_type.upper()}
Tier: {tier}/3
Confidence: {confidence:.0%}
Strategy: {'Full Context' if tier == 3 else 'Expanded RAG' if tier == 2 else 'Standard RAG'}
TOP_K: {new_top_k}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{system_addition}
"""
            
            if system_msg_idx is not None:
                messages[system_msg_idx]["content"] += context_note
            else:
                messages.insert(0, {
                    "role": "system",
                    "content": context_note
                })
            
            if self.valves.verbose:
                print(f"\n[IntelligentRAG] ════════════════════════════════════════")
                print(f"[IntelligentRAG] Query: {last_message[:60]}...")
                print(f"[IntelligentRAG] Classified: Tier {tier} ({query_type})")
                print(f"[IntelligentRAG] Confidence: {confidence:.0%}")
                print(f"[IntelligentRAG] TOP_K: {new_top_k}")
                if tier == 3:
                    print(f"[IntelligentRAG] ⚡ RAG_FULL_CONTEXT: ENABLED")
                print(f"[IntelligentRAG] ════════════════════════════════════════\n")
        
        return body
    
    def outlet(self, body: Dict, __user__: Optional[Dict] = None) -> Dict:
        """
        Process outgoing response from LLM.
        Check for full context requests.
        """
        if not self.valves.enabled or not self.valves.auto_reroll:
            return body
        
        # Get the assistant's response
        messages = body.get("messages", [])
        last_assistant_msg = None
        for msg in reversed(messages):
            if msg.get("role") == "assistant":
                last_assistant_msg = msg.get("content", "")
                break
        
        if not last_assistant_msg:
            return body
        
        # Check if response requests full context
        has_marker, reasoning = self.check_response_for_full_context(last_assistant_msg)
        
        if has_marker:
            if self.valves.verbose:
                print(f"\n[IntelligentRAG] ⚠️ Model requested full context!")
                print(f"[IntelligentRAG] Reason: {reasoning[:80]}...")
                print(f"[IntelligentRAG] Consider enabling RAG_FULL_CONTEXT manually\n")
            
            # Store the request in metadata
            if "metadata" not in body:
                body["metadata"] = {}
            if "intelligent_rag" not in body["metadata"]:
                body["metadata"]["intelligent_rag"] = {}
            body["metadata"]["intelligent_rag"]["reroll_requested"] = True
            body["metadata"]["intelligent_rag"]["reroll_reason"] = reasoning
        
        return body


class Pipe:
    """
    Alternative implementation as a Pipe for Open WebUI.
    Can be used as a pipeline step for intelligent context management.
    """
    
    class Valves(BaseModel):
        enabled: bool = Field(default=True)
        classifier_url: str = Field(default="http://localhost:8765")
        default_tier: int = Field(default=1, ge=1, le=3)
    
    def __init__(self):
        self.type = "pipe"
        self.id = "intelligent-rag"
        self.name = "Intelligent RAG"
        self.valves = self.Valves()
        self.filter = Filter()
    
    async def pipe(self, body: Dict, __user__: Optional[Dict] = None) -> Dict:
        """Process the request through the intelligent RAG pipeline."""
        return self.filter.inlet(body, __user__)


# Event hook handlers for Open WebUI integration
def on_message_begin(body: Dict, __user__: Dict) -> Dict:
    """Hook called when a message begins processing."""
    filter_instance = Filter()
    return filter_instance.inlet(body, __user__)


def on_message_end(body: Dict, __user__: Dict) -> Dict:
    """Hook called when a message finishes processing."""
    filter_instance = Filter()
    return filter_instance.outlet(body, __user__)
