#!/usr/bin/env python3
"""
RAG Upload Script with Full Context Retrieval

Uploads files to Open WebUI knowledge bases with proper chunking
and full context settings enabled.

Usage:
    python rag_upload_script.py --kb "SYNAPTICA - Production" --dir /path/to/docs
    python rag_upload_script.py --sync-all
    python rag_upload_script.py --verify
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from typing import List, Dict, Optional
import requests

# Configuration
OPEN_WEBUI_URL = "http://localhost:3115"
OPEN_WEBUI_API_KEY = os.getenv("OPEN_WEBUI_API_KEY", "")
INTELLIGENT_RAG_URL = "http://localhost:8765"

# Knowledge base mappings
KB_MAPPINGS = {
    "Thalamus-Company": {
        "path": "/Users/sesloan/Documents/companies/Thalamus/docs/master",
        "patterns": ["**/*.md", "**/*.mdx", "**/*.txt"]
    },
    "CortexDigital-Company": {
        "path": "/Users/sesloan/Documents/companies/Cortex Digital/docs/master",
        "patterns": ["**/*.md", "**/*.mdx", "**/*.txt"]
    },
    "HypeLocal-Company": {
        "path": "/Users/sesloan/Documents/companies/Hype Local/docs/master",
        "patterns": ["**/*.md", "**/*.mdx", "**/*.txt"]
    },
    "SYNAPTICA - Production": {
        "path": "/Users/sesloan/repos/thalamus-ai/SYNAPTICA/docs/master-production",
        "patterns": ["**/*.md", "**/*.mdx"]
    },
    "SYNAPTICA - Development": {
        "path": "/Users/sesloan/repos/thalamus-ai/SYNAPTICA/docs/master-development",
        "patterns": ["**/*.md", "**/*.mdx"]
    },
    "ExecutionIQ - Production": {
        "path": "/Users/sesloan/repos/thalamus-ai/ExecutionIQ/docs/master-production",
        "patterns": ["**/*.md", "**/*.mdx"]
    },
    "ExecutionIQ - Development": {
        "path": "/Users/sesloan/repos/thalamus-ai/ExecutionIQ/docs/master-development",
        "patterns": ["**/*.md", "**/*.mdx"]
    }
}


class OpenWebUIClient:
    """Client for Open WebUI API."""
    
    def __init__(self, base_url: str = OPEN_WEBUI_URL, api_key: str = OPEN_WEBUI_API_KEY):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def list_knowledge_bases(self) -> List[Dict]:
        """List all knowledge bases."""
        resp = requests.get(
            f"{self.base_url}/api/v1/knowledge/",
            headers=self.headers
        )
        resp.raise_for_status()
        return resp.json().get('items', [])
    
    def get_or_create_knowledge_base(self, name: str, description: str = "") -> str:
        """Get existing KB or create new one."""
        # Check existing
        for kb in self.list_knowledge_bases():
            if kb['name'] == name:
                print(f"  Found existing KB: {name} ({kb['id']})")
                return kb['id']
        
        # Create new
        resp = requests.post(
            f"{self.base_url}/api/v1/knowledge/create",
            headers=self.headers,
            json={
                "name": name,
                "description": description,
                "access_control": {}
            }
        )
        resp.raise_for_status()
        kb_id = resp.json()['id']
        print(f"  Created new KB: {name} ({kb_id})")
        return kb_id
    
    def upload_file(self, file_path: Path) -> Optional[str]:
        """Upload a file to Open WebUI."""
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (file_path.name, f, 'text/markdown')}
                headers = {'Authorization': f'Bearer {self.api_key}'}
                resp = requests.post(
                    f"{self.base_url}/api/v1/files/",
                    headers=headers,
                    files=files
                )
                resp.raise_for_status()
                return resp.json()['id']
        except Exception as e:
            print(f"    ❌ Upload failed: {e}")
            return None
    
    def wait_for_processing(self, file_id: str, timeout: int = 30) -> bool:
        """Wait for file processing to complete."""
        for _ in range(timeout):
            try:
                resp = requests.get(
                    f"{self.base_url}/api/v1/files/{file_id}",
                    headers=self.headers
                )
                if resp.status_code == 200:
                    status = resp.json().get('data', {}).get('status')
                    if status == 'completed':
                        return True
                    elif status == 'failed':
                        return False
            except:
                pass
            time.sleep(1)
        return False
    
    def add_file_to_knowledge(self, kb_id: str, file_id: str) -> bool:
        """Add a file to a knowledge base."""
        try:
            resp = requests.post(
                f"{self.base_url}/api/v1/knowledge/{kb_id}/file/add",
                headers=self.headers,
                json={'file_id': file_id}
            )
            resp.raise_for_status()
            return True
        except Exception as e:
            print(f"    ❌ Add to KB failed: {e}")
            return False
    
    def delete_knowledge_base(self, kb_id: str) -> bool:
        """Delete a knowledge base."""
        try:
            resp = requests.delete(
                f"{self.base_url}/api/v1/knowledge/{kb_id}",
                headers=self.headers
            )
            return resp.status_code in [200, 204]
        except:
            return False
    
    def update_rag_settings(self, settings: Dict) -> bool:
        """Update global RAG settings."""
        try:
            resp = requests.post(
                f"{self.base_url}/api/v1/configs/",
                headers=self.headers,
                json={'rag': settings}
            )
            resp.raise_for_status()
            return True
        except Exception as e:
            print(f"❌ Failed to update RAG settings: {e}")
            return False


class RAGUploader:
    """Handles uploading files with full context settings."""
    
    def __init__(self, client: OpenWebUIClient):
        self.client = client
    
    def find_files(self, directory: str, patterns: List[str]) -> List[Path]:
        """Find files matching patterns."""
        base_path = Path(directory)
        files = []
        for pattern in patterns:
            files.extend(base_path.glob(pattern))
        # Filter and dedupe
        files = [f for f in files if f.is_file()]
        return sorted(set(files))
    
    def upload_knowledge_base(self, kb_name: str, config: Dict) -> Dict:
        """Upload all files for a knowledge base."""
        print(f"\n📚 Processing: {kb_name}")
        
        # Get or create KB
        kb_id = self.client.get_or_create_knowledge_base(
            kb_name, 
            f"Documentation for {kb_name}"
        )
        
        # Find files
        files = self.find_files(config['path'], config['patterns'])
        print(f"  Found {len(files)} files")
        
        # Upload each file
        uploaded = 0
        failed = 0
        
        for i, file_path in enumerate(files, 1):
            print(f"  [{i}/{len(files)}] {file_path.name}", end=" ")
            
            # Upload
            file_id = self.client.upload_file(file_path)
            if not file_id:
                failed += 1
                print("❌")
                continue
            
            # Wait for processing
            if not self.client.wait_for_processing(file_id, timeout=30):
                print("⏱️ timeout")
                failed += 1
                continue
            
            # Add to knowledge base
            if self.client.add_file_to_knowledge(kb_id, file_id):
                uploaded += 1
                print("✅")
            else:
                failed += 1
                print("❌")
        
        return {
            'kb_name': kb_name,
            'kb_id': kb_id,
            'total': len(files),
            'uploaded': uploaded,
            'failed': failed
        }
    
    def sync_all(self) -> List[Dict]:
        """Sync all knowledge bases."""
        results = []
        for kb_name, config in KB_MAPPINGS.items():
            if not Path(config['path']).exists():
                print(f"⚠️  Path not found: {config['path']}")
                continue
            result = self.upload_knowledge_base(kb_name, config)
            results.append(result)
        return results
    
    def verify_knowledge_bases(self) -> None:
        """Verify all knowledge bases have files."""
        print("\n🔍 Verifying Knowledge Bases:")
        
        for kb in self.client.list_knowledge_bases():
            kb_id = kb['id']
            kb_name = kb['name']
            files = kb.get('files', [])
            file_count = len(files) if files else 0
            
            status = "✅" if file_count > 0 else "❌"
            print(f"  {status} {kb_name}: {file_count} files")
    
    def configure_rag_settings(self) -> bool:
        """Configure RAG for full context retrieval."""
        print("\n⚙️  Configuring RAG Settings:")
        
        settings = {
            "chunk_size": 4000,        # Larger chunks
            "chunk_overlap": 200,      # More overlap
            "top_k": 100,              # More results
            "enable_rag_full_context": True,  # Enable full context
            "max_context_window": 50000       # Maximize context
        }
        
        if self.client.update_rag_settings(settings):
            print("  ✅ RAG settings updated")
            return True
        else:
            print("  ❌ Failed to update settings")
            return False


def main():
    parser = argparse.ArgumentParser(description='RAG Upload Script')
    parser.add_argument('--kb', help='Specific knowledge base name')
    parser.add_argument('--dir', help='Directory to upload from')
    parser.add_argument('--sync-all', action='store_true', help='Sync all knowledge bases')
    parser.add_argument('--verify', action='store_true', help='Verify knowledge bases')
    parser.add_argument('--configure', action='store_true', help='Configure RAG settings')
    parser.add_argument('--api-key', help='Open WebUI API key')
    
    args = parser.parse_args()
    
    # Set API key
    api_key = args.api_key or OPEN_WEBUI_API_KEY
    if not api_key:
        print("❌ Error: OPEN_WEBUI_API_KEY not set")
        print("Set via environment variable or --api-key")
        sys.exit(1)
    
    # Initialize client
    client = OpenWebUIClient(api_key=api_key)
    uploader = RAGUploader(client)
    
    # Execute commands
    if args.verify:
        uploader.verify_knowledge_bases()
    
    elif args.configure:
        uploader.configure_rag_settings()
    
    elif args.sync_all:
        print("🔄 Syncing all knowledge bases...")
        results = uploader.sync_all()
        
        print("\n📊 Summary:")
        for r in results:
            print(f"  {r['kb_name']}: {r['uploaded']}/{r['total']} uploaded")
    
    elif args.kb and args.dir:
        config = {
            'path': args.dir,
            'patterns': ['**/*.md', '**/*.mdx', '**/*.txt']
        }
        result = uploader.upload_knowledge_base(args.kb, config)
        print(f"\n✅ Done: {result['uploaded']} files uploaded")
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
