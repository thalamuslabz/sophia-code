#!/usr/bin/env python3
"""
Intelligent Adaptive RAG System for Open WebUI

Implements multi-tier context management that intelligently determines
c context depth based on query classification.

Usage:
    python intelligent_rag.py --classify "What's the auth endpoint?"
    python intelligent_rag.py --mode comprehensive --query "Design the system architecture"
    python intelligent_rag.py server --port 8765
"""

import os
import sys
import json
import re
import argparse
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Literal
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs


class QueryType(Enum):
    """Classification of query types for context management."""
    SPECIFIC_LOOKUP = "specific_lookup"
    COMPREHENSIVE_ANALYSIS = "comprehensive_analysis"
    CREATIVE_SYNTHESIS = "creative_synthesis"


@dataclass
class QueryClassification:
    """Result of query classification."""
    query_type: QueryType
    confidence: float
    reasoning: str
    recommended_tier: int
    rag_full_context: bool
    top_k: int


@dataclass
class RAGConfig:
    """RAG configuration for a specific tier."""
    name: str
    query_type: QueryType
    rag_full_context: bool
    top_k: int
    description: str
    system_prompt_addition: str


# Default tier configurations
TIER_CONFIGS = {
    1: RAGConfig(
        name="Standard Queries (Default)",
        query_type=QueryType.SPECIFIC_LOOKUP,
        rag_full_context=False,
        top_k=15,
        description="Chunked RAG for specific questions, lookups, code examples",
        system_prompt_addition="""
Use the provided RAG context chunks to answer the user's specific question.
Focus on extracting the exact information requested.
"""
    ),
    2: RAGConfig(
        name="Comprehensive Analysis",
        query_type=QueryType.COMPREHENSIVE_ANALYSIS,
        rag_full_context=False,
        top_k=50,
        description="Full document retrieval for architecture questions, design decisions",
        system_prompt_addition="""
This query requires comprehensive analysis across multiple documents.
If the provided chunks are insufficient, respond with [REQUEST_FULL_CONTEXT] 
followed by an explanation of what additional context is needed.
"""
    ),
    3: RAGConfig(
        name="Full Knowledge Base",
        query_type=QueryType.CREATIVE_SYNTHESIS,
        rag_full_context=True,
        top_k=100,
        description="RAG_FULL_CONTEXT=True for complete system understanding",
        system_prompt_addition="""
This query requires complete knowledge base context for creative synthesis.
Respond with [REQUEST_FULL_CONTEXT] to retrieve all documents.
"""
    )
}


class QueryClassifier:
    """Classifies user queries to determine appropriate context strategy."""
    
    # Keywords indicating comprehensive/creative queries (Tier 2-3)
    COMPREHENSIVE_KEYWORDS = [
        # Architecture and design
        "architecture", "architectural", "system design", "design pattern",
        "component", "module", "integration", "infrastructure",
        "data flow", "workflow", "sequence", "interaction",
        # Analysis and review
        "review", "analyze", "analysis", "assess", "assessment",
        "evaluate", "evaluation", "audit", "comprehensive",
        # Creation and generation
        "create", "generate", "build", "design", "develop",
        "diagram", "chart", "flowchart", "visualization",
        "document", "documentation", "proposal", "plan",
        # Full/system-wide queries
        "full", "complete", "entire", "whole", "system-wide",
        "overview", "summary", "big picture", "holistic",
        # Cross-cutting concerns
        "security", "performance", "scalability", "reliability",
        "how does.*connect", "how do.*interact", "relationship between"
    ]
    
    # Keywords indicating specific lookups (Tier 1)
    SPECIFIC_KEYWORDS = [
        # Direct questions
        "what is", "what's", "how to", "how do i", "how can i",
        "where is", "where can", "when should", "why is",
        # Specific lookups
        "endpoint", "api", "url", "path", "route",
        "function", "method", "class", "variable", "constant",
        "parameter", "argument", "return", "type",
        "config", "configuration", "setting", "option",
        "error", "exception", "bug", "issue", "fix",
        # Code-specific
        "code", "snippet", "example", "sample",
        "import", "export", "require", "include",
        "install", "setup", "configure", "run", "execute",
        "version", "dependency", "package", "library"
    ]
    
    # Patterns for creative synthesis (Tier 3 - highest priority)
    CREATIVE_PATTERNS = [
        r"create\s+(?:a|an|the)\s+(?:diagram|chart|visualization|drawing)",
        r"generate\s+(?:a|an|the)\s+(?:diagram|chart|doc|document|report)",
        r"draw\s+(?:a|an|the)\s+(?:architecture|diagram|flow|chart)",
        r"design\s+(?:a|an|the)\s+(?:system|architecture|solution|approach)",
        r"build\s+(?:a|an|the)\s+(?:package|deliverable|presentation)",
        r"full\s+(?:architecture|system|documentation|overview)",
        r"complete\s+(?:architecture|system|documentation|overview)",
        r"comprehensive\s+(?:diagram|documentation|analysis|review)"
    ]
    
    def __init__(self):
        self.creative_patterns = [re.compile(p, re.IGNORECASE) for p in self.CREATIVE_PATTERNS]
    
    def classify(self, query: str) -> QueryClassification:
        """
        Classify a query and return recommended RAG configuration.
        
        Args:
            query: The user's query string
            
        Returns:
            QueryClassification with tier recommendation
        """
        query_lower = query.lower()
        
        # Check for creative synthesis patterns (Tier 3)
        creative_matches = sum(1 for pattern in self.creative_patterns if pattern.search(query))
        if creative_matches > 0:
            return QueryClassification(
                query_type=QueryType.CREATIVE_SYNTHESIS,
                confidence=min(0.7 + (creative_matches * 0.1), 0.95),
                reasoning=f"Detected creative synthesis pattern ({creative_matches} matches). Query requires complete knowledge base context.",
                recommended_tier=3,
                rag_full_context=True,
                top_k=TIER_CONFIGS[3].top_k
            )
        
        # Score comprehensive vs specific keywords
        comp_score = sum(1 for k in self.COMPREHENSIVE_KEYWORDS if k in query_lower)
        spec_score = sum(1 for k in self.SPECIFIC_KEYWORDS if k in query_lower)
        
        # Check for architecture/design patterns
        arch_indicators = [
            "architecture" in query_lower,
            "design" in query_lower and "pattern" in query_lower,
            "system" in query_lower and any(x in query_lower for x in ["flow", "diagram", "overview"]),
            "how" in query_lower and any(x in query_lower for x in ["connect", "interact", "work together"])
        ]
        arch_score = sum(arch_indicators)
        
        # Decision logic
        if comp_score > spec_score or arch_score >= 2:
            # Comprehensive analysis (Tier 2)
            confidence = min(0.6 + (comp_score * 0.05) + (arch_score * 0.1), 0.9)
            return QueryClassification(
                query_type=QueryType.COMPREHENSIVE_ANALYSIS,
                confidence=confidence,
                reasoning=f"Comprehensive keywords ({comp_score}) > specific keywords ({spec_score}). Architecture indicators: {arch_score}. Query likely requires full document context.",
                recommended_tier=2,
                rag_full_context=False,  # Start with expanded chunks
                top_k=TIER_CONFIGS[2].top_k
            )
        
        # Default to specific lookup (Tier 1)
        confidence = min(0.6 + (spec_score * 0.05), 0.9)
        return QueryClassification(
            query_type=QueryType.SPECIFIC_LOOKUP,
            confidence=confidence,
            reasoning=f"Specific keywords ({spec_score}) >= comprehensive ({comp_score}). Standard chunked RAG is sufficient.",
            recommended_tier=1,
            rag_full_context=False,
            top_k=TIER_CONFIGS[1].top_k
        )
    
    def get_system_prompt_addition(self, classification: QueryClassification) -> str:
        """Get the system prompt addition for the classified query."""
        return TIER_CONFIGS[classification.recommended_tier].system_prompt_addition


class RAGResponseHandler:
    """Handles model responses for full context requests."""
    
    FULL_CONTEXT_MARKER = "[REQUEST_FULL_CONTEXT]"
    
    def check_for_full_context_request(self, response: str) -> Tuple[bool, str]:
        """
        Check if response contains a full context request marker.
        
        Returns:
            Tuple of (has_marker, reasoning)
        """
        if self.FULL_CONTEXT_MARKER in response:
            # Extract reasoning after marker
            parts = response.split(self.FULL_CONTEXT_MARKER, 1)
            reasoning = parts[1].strip() if len(parts) > 1 else "Full context requested by model"
            return True, reasoning
        return False, ""
    
    def create_reroll_config(self, original_config: Dict, reasoning: str) -> Dict:
        """
        Create a new RAG config for reroll with full context.
        
        Args:
            original_config: Original RAG configuration
            reasoning: Why full context is needed
            
        Returns:
            Updated configuration with RAG_FULL_CONTEXT=True
        """
        new_config = original_config.copy()
        new_config["rag_full_context"] = True
        new_config["top_k"] = 100
        new_config["reason"] = reasoning
        new_config["is_reroll"] = True
        return new_config


class IntelligentRAGServer:
    """HTTP server for Intelligent RAG classification service."""
    
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.classifier = QueryClassifier()
        self.handler = RAGResponseHandler()
    
    def start(self):
        """Start the HTTP server."""
        
        class RequestHandler(http.server.BaseHTTPRequestHandler):
            server_instance = self
            
            def log_message(self, format, *args):
                # Custom logging
                print(f"[{datetime.now().isoformat()}] {args[0]}")
            
            def do_GET(self):
                parsed = urlparse(self.path)
                path = parsed.path
                query_params = parse_qs(parsed.query)
                
                if path == "/health":
                    self.send_json({"status": "healthy", "service": "intelligent-rag"})
                
                elif path == "/classify":
                    query = query_params.get("q", [""])[0]
                    if not query:
                        self.send_error(400, "Missing query parameter 'q'")
                        return
                    
                    classification = self.server_instance.classifier.classify(query)
                    self.send_json({
                        "query": query,
                        "classification": {
                            "type": classification.query_type.value,
                            "confidence": classification.confidence,
                            "reasoning": classification.reasoning,
                            "recommended_tier": classification.recommended_tier,
                            "rag_full_context": classification.rag_full_context,
                            "top_k": classification.top_k
                        }
                    })
                
                elif path == "/tiers":
                    tiers = {}
                    for tier_num, config in TIER_CONFIGS.items():
                        tiers[tier_num] = {
                            "name": config.name,
                            "query_type": config.query_type.value,
                            "rag_full_context": config.rag_full_context,
                            "top_k": config.top_k,
                            "description": config.description
                        }
                    self.send_json(tiers)
                
                else:
                    self.send_error(404, "Not found")
            
            def do_POST(self):
                parsed = urlparse(self.path)
                path = parsed.path
                
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                
                try:
                    data = json.loads(body) if body else {}
                except json.JSONDecodeError:
                    self.send_error(400, "Invalid JSON")
                    return
                
                if path == "/classify":
                    query = data.get("query", "")
                    if not query:
                        self.send_error(400, "Missing 'query' field")
                        return
                    
                    classification = self.server_instance.classifier.classify(query)
                    self.send_json({
                        "query": query,
                        "classification": {
                            "type": classification.query_type.value,
                            "confidence": classification.confidence,
                            "reasoning": classification.reasoning,
                            "recommended_tier": classification.recommended_tier,
                            "rag_full_context": classification.rag_full_context,
                            "top_k": classification.top_k
                        },
                        "system_prompt_addition": self.server_instance.classifier.get_system_prompt_addition(classification)
                    })
                
                elif path == "/check-response":
                    response = data.get("response", "")
                    has_marker, reasoning = self.server_instance.handler.check_for_full_context_request(response)
                    
                    result = {
                        "has_full_context_request": has_marker,
                        "reasoning": reasoning
                    }
                    
                    if has_marker:
                        original_config = data.get("rag_config", {})
                        result["reroll_config"] = self.server_instance.handler.create_reroll_config(
                            original_config, reasoning
                        )
                    
                    self.send_json(result)
                
                else:
                    self.send_error(404, "Not found")
            
            def send_json(self, data: Dict):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(data, indent=2).encode())
            
            def send_error(self, code: int, message: str):
                self.send_response(code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": message}).encode())
            
            def do_OPTIONS(self):
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
        
        with socketserver.TCPServer((self.host, self.port), RequestHandler) as httpd:
            print(f"🚀 Intelligent RAG Server running at http://{self.host}:{self.port}")
            print("   Endpoints:")
            print(f"   - GET  /health")
            print(f"   - GET  /classify?q=<query>")
            print(f"   - GET  /tiers")
            print(f"   - POST /classify (JSON body: {{\"query\": \"...\"}})")
            print(f"   - POST /check-response (JSON body: {{\"response\": \"...\", \"rag_config\": {{...}}}})")
            print("\n   Press Ctrl+C to stop")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n👋 Server stopped")


def print_classification(classification: QueryClassification, query: str):
    """Print classification result in a formatted way."""
    tier_config = TIER_CONFIGS[classification.recommended_tier]
    
    print(f"\n{'='*60}")
    print(f"📝 Query: {query}")
    print(f"{'='*60}")
    print(f"📊 Classification: {classification.query_type.value.upper()}")
    print(f"   Confidence: {classification.confidence:.0%}")
    print(f"\n💡 Reasoning:
   {classification.reasoning}")
    print(f"\n🎯 Recommended Tier: {classification.recommended_tier}")
    print(f"   Name: {tier_config.name}")
    print(f"   RAG_FULL_CONTEXT: {classification.rag_full_context}")
    print(f"   TOP_K: {classification.top_k}")
    print(f"\n📋 System Prompt Addition:
   {tier_config.system_prompt_addition.strip()}")
    print(f"{'='*60}\n")


def interactive_mode(classifier: QueryClassifier):
    """Run interactive classification mode."""
    print("\n🤖 Intelligent RAG Interactive Mode")
    print("   Type your queries to see classification results.")
    print("   Commands: 'quit' to exit, 'tiers' to see tier info\n")
    
    while True:
        try:
            query = input("Query> ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if query.lower() == 'tiers':
                print("\n📚 Available Tiers:")
                for tier_num, config in TIER_CONFIGS.items():
                    print(f"\n   Tier {tier_num}: {config.name}")
                    print(f"   - Query Type: {config.query_type.value}")
                    print(f"   - RAG_FULL_CONTEXT: {config.rag_full_context}")
                    print(f"   - TOP_K: {config.top_k}")
                    print(f"   - {config.description}")
                print()
                continue
            
            if not query:
                continue
            
            classification = classifier.classify(query)
            print_classification(classification, query)
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except EOFError:
            break


def main():
    parser = argparse.ArgumentParser(
        description='Intelligent Adaptive RAG System for Open WebUI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Classify a query
    python intelligent_rag.py --classify "What's the auth endpoint?"
    
    # Interactive mode
    python intelligent_rag.py --interactive
    
    # Start server
    python intelligent_rag.py server --port 8765
    
    # Check response for full context request
    python intelligent_rag.py --check-response "[REQUEST_FULL_CONTEXT] Need more docs"
        """
    )
    
    parser.add_argument('--classify', '-c', metavar='QUERY',
                       help='Classify a single query')
    parser.add_argument('--interactive', '-i', action='store_true',
                       help='Run in interactive mode')
    parser.add_argument('--check-response', '-r', metavar='RESPONSE',
                       help='Check if response requests full context')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Server command
    server_parser = subparsers.add_parser('server', help='Start HTTP server')
    server_parser.add_argument('--host', default='localhost',
                              help='Host to bind to (default: localhost)')
    server_parser.add_argument('--port', '-p', type=int, default=8765,
                              help='Port to listen on (default: 8765)')
    
    args = parser.parse_args()
    
    classifier = QueryClassifier()
    handler = RAGResponseHandler()
    
    if args.classify:
        classification = classifier.classify(args.classify)
        print_classification(classification, args.classify)
    
    elif args.check_response:
        has_marker, reasoning = handler.check_for_full_context_request(args.check_response)
        print(f"\n{'='*60}")
        print(f"🔍 Response Analysis")
        print(f"{'='*60}")
        print(f"Response: {args.check_response}")
        print(f"\nFull Context Requested: {'✅ Yes' if has_marker else '❌ No'}")
        if has_marker:
            print(f"Reasoning: {reasoning}")
        print(f"{'='*60}\n")
    
    elif args.interactive:
        interactive_mode(classifier)
    
    elif args.command == 'server':
        server = IntelligentRAGServer(args.host, args.port)
        server.start()
    
    else:
        # Default to interactive mode if no args
        interactive_mode(classifier)


if __name__ == '__main__':
    main()
