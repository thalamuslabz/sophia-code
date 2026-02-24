#!/usr/bin/env python3
"""
Open WebUI Knowledge Base Sync Tool

Synchronizes markdown documentation from product/project repos to Open WebUI knowledge bases.
Supports both production (locked) and development (working) states.

Usage:
    python knowledge_sync.py --config products.yaml
    python knowledge_sync.py --product SYNAPTICA --sync
    python knowledge_sync.py --list
    python knowledge_sync.py --watch
"""

import os
import sys
import json
import yaml
import time
import argparse
import requests
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import hashlib


@dataclass
class KnowledgeConfig:
    """Configuration for a knowledge base sync target."""
    name: str  # e.g., "SYNAPTICA"
    production_path: str  # Path to master-production docs
    development_path: str  # Path to master-development docs
    obsidian_prod_path: Optional[str] = None  # Optional: Obsidian 02-PRODUCTS path
    obsidian_dev_path: Optional[str] = None   # Optional: Obsidian 06-PROJECTS path
    description: str = ""
    file_patterns: List[str] = None
    exclude_patterns: List[str] = None
    single_kb: bool = False  # If True, creates only one knowledge base (no Production/Dev split)
    
    def __post_init__(self):
        if self.file_patterns is None:
            self.file_patterns = ["**/*.md", "**/*.mdx"]
        if self.exclude_patterns is None:
            self.exclude_patterns = [".git", "node_modules", "__pycache__", ".obsidian"]


class OpenWebUIClient:
    """Client for interacting with Open WebUI API."""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def list_knowledge(self) -> List[Dict]:
        """List all knowledge collections."""
        url = f"{self.base_url}/api/v1/knowledge/"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        data = response.json()
        return data.get('items', [])
    
    def create_knowledge(self, name: str, description: str = "", 
                        data: Dict = None, access_control: Dict = None) -> Dict:
        """Create a new knowledge collection."""
        url = f"{self.base_url}/api/v1/knowledge/create"
        payload = {
            "name": name,
            "description": description,
            "data": data or {},
            "access_control": access_control or {}
        }
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()
    
    def get_knowledge(self, knowledge_id: str) -> Dict:
        """Get a specific knowledge collection."""
        url = f"{self.base_url}/api/v1/knowledge/{knowledge_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def delete_knowledge(self, knowledge_id: str) -> Dict:
        """Delete a knowledge collection."""
        url = f"{self.base_url}/api/v1/knowledge/{knowledge_id}"
        response = requests.delete(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def upload_file(self, file_path: Path) -> Dict:
        """Upload a file to Open WebUI."""
        url = f"{self.base_url}/api/v1/files/"
        headers = {'Authorization': f'Bearer {self.api_key}'}
        
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'text/plain')}
            response = requests.post(url, headers=headers, files=files)
        
        response.raise_for_status()
        import time
        time.sleep(2) # Allow Open WebUI's async extractor queue to populate the data column before we bind it to a KB
        return response.json()
    
    def add_file_to_knowledge(self, knowledge_id: str, file_id: str, retries=2) -> Dict:
        """Add an uploaded file to a knowledge collection."""
        url = f"{self.base_url}/api/v1/knowledge/{knowledge_id}/file/add"
        data = {'file_id': file_id}
        
        for attempt in range(retries + 1):
            response = requests.post(url, headers=self.headers, json=data)
            try:
                response.raise_for_status()
                return response.json()
            except requests.exceptions.HTTPError as e:
                # Open WebUI httpx client to Qdrant sometimes times out on slow lazily-created collections
                # Open WebUI async extractor queue sometimes hasn't finished extracting text yet
                err_text = response.text.lower()
                if response.status_code == 400 and ("timed out" in err_text or "empty" in err_text):
                    if attempt < retries:
                        print(f"   ⏳ Waiting on async tasks (extractor/qdrant). Retrying in 5s... (Attempt {attempt+1}/{retries})")
                        import time
                        time.sleep(5)
                        continue
                print(f"API Error Response: {response.text}")
                raise e
    
    def remove_file_from_knowledge(self, knowledge_id: str, file_id: str) -> Dict:
        """Remove a file from a knowledge collection."""
        url = f"{self.base_url}/api/v1/knowledge/{knowledge_id}/file/remove"
        data = {'file_id': file_id}
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

class KnowledgeSync:
    """Main sync orchestrator for knowledge bases with auto-discovery."""
    
    # Organizations to scan for repos
    REPO_ORGS = ["thalamus-ai", "cortex-digital", "hype-local", "thalamus-labz"]
    REPO_BASE = Path.home() / "repos"
    COMPANIES_BASE = Path.home() / "Documents/companies"
    
    def __init__(self, client: OpenWebUIClient, config_path: str = None):
        self.client = client
        self.config_path = Path(config_path) if config_path else None
        self.configs: Dict[str, KnowledgeConfig] = {}
        self.sync_state_file = Path.home() / ".knowledge_sync_state.json"
        self.sync_state = self.load_sync_state()
    
    def load_configs(self):
        """Load product/project configurations from YAML."""
        if self.config_path and self.config_path.exists():
            with open(self.config_path, 'r') as f:
                data = yaml.safe_load(f)
            
            for item in data.get('products', []):
                config = KnowledgeConfig(**item)
                self.configs[config.name] = config
    
    def discover_repos(self) -> Dict[str, KnowledgeConfig]:
        """
        Auto-discover repositories with docs/master-production folders.
        Scans: /Users/sesloan/repos/{org}/*/
        """
        discovered = {}
        
        for org in self.REPO_ORGS:
            org_path = self.REPO_BASE / org
            if not org_path.exists():
                continue
            
            for repo_dir in org_path.iterdir():
                if not repo_dir.is_dir():
                    continue
                
                repo_name = repo_dir.name
                prod_path = repo_dir / "docs/master-production"
                dev_path = repo_dir / "docs/master-development"
                
                # Only add if production docs exist
                if prod_path.exists():
                    config = KnowledgeConfig(
                        name=repo_name,
                        production_path=str(prod_path),
                        development_path=str(dev_path) if dev_path.exists() else str(prod_path),
                        description=f"Documentation for {repo_name} ({org})"
                    )
                    discovered[repo_name] = config
                    print(f"  🔍 Discovered repo: {repo_name} ({org})")
        
        return discovered
    
    OBSIDIAN_BASE = Path.home() / "Documents/Obsidian Vault"
    
    def discover_companies(self) -> Dict[str, KnowledgeConfig]:
        """
        Auto-discover companies from Obsidian Vault.
        Scans: /Users/sesloan/Documents/Obsidian Vault/*/
        """
        discovered = {}
        
        if not self.OBSIDIAN_BASE.exists():
            return discovered
            
        for company_name in self.REPO_ORGS:
            company_dir = self.OBSIDIAN_BASE / company_name
            if not company_dir.exists() or not company_dir.is_dir():
                continue
            
            # Map specific companies if needed, but the folder is the company
            kb_name = company_name.title().replace("-", "")
            
            config = KnowledgeConfig(
                name=kb_name,
                production_path=str(company_dir / "01-COMPANY" / "master"),
                development_path=str(company_dir / "01-COMPANY" / "master"),
                description=f"{company_name} company documentation",
                single_kb=True
            )
            discovered[kb_name] = config
            print(f"  🔍 Discovered company in vault: {company_name}")
        
        return discovered
    
    def load_all_configs(self, auto_discover: bool = True):
        """
        Load all configs from YAML and/or auto-discovery.
        
        Args:
            auto_discover: If True, scan for repos and companies
        """
        # First load explicit configs from YAML
        self.load_configs()
        
        if auto_discover:
            print("\n🔍 Auto-discovering repositories...")
            repo_configs = self.discover_repos()
            
            print("\n🔍 Auto-discovering companies...")
            company_configs = self.discover_companies()
            
            # Merge discovered configs (don't override explicit ones)
            for name, config in {**repo_configs, **company_configs}.items():
                if name not in self.configs:
                    self.configs[name] = config
        
        print(f"\n📊 Total configs loaded: {len(self.configs)}")
    
    def load_sync_state(self) -> Dict:
        """Load previous sync state for incremental syncs."""
        if self.sync_state_file.exists():
            with open(self.sync_state_file, 'r') as f:
                return json.load(f)
        return {}
    
    def save_sync_state(self):
        """Save current sync state."""
        with open(self.sync_state_file, 'w') as f:
            json.dump(self.sync_state, f, indent=2)
    
    def get_file_hash(self, file_path: Path) -> str:
        """Get MD5 hash of file content for change detection."""
        try:
            if not file_path.exists() or file_path.is_symlink():
                return ""
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return ""
    
    def find_markdown_files(self, directory: Path, config: KnowledgeConfig) -> List[Path]:
        """Find all markdown files matching patterns in directory."""
        files = []
        for pattern in config.file_patterns:
            files.extend(directory.glob(pattern))
        
        # Filter out excluded patterns
        filtered = []
        for file in files:
            if not any(excl in str(file) for excl in config.exclude_patterns):
                filtered.append(file)
        
        return sorted(set(filtered))
    
    def get_or_create_knowledge(self, name: str, description: str) -> str:
        """Get existing knowledge collection or create new one."""
        # Check existing collections
        existing = self.client.list_knowledge()
        for kb in existing:
            if kb['name'] == name:
                print(f"  Found existing knowledge base: {name} (ID: {kb['id']})")
                return kb['id']
        
        # Create new collection
        print(f"  Creating new knowledge base: {name}")
        result = self.client.create_knowledge(name, description)
        return result['id']
    
    def sync_knowledge_base(self, config: KnowledgeConfig, environment: str) -> Dict:
        """
        Sync a single knowledge base (production or development).
        
        Args:
            config: Knowledge configuration
            environment: 'production' or 'development'
        """
        # Determine paths
        if environment == 'production':
            source_path = Path(config.production_path)
            kb_name = f"{config.name} - Production"
            description = f"Production documentation for {config.name}. Locked source-of-truth."
        else:
            source_path = Path(config.development_path)
            kb_name = f"{config.name} - Development"
            description = f"Development documentation for {config.name}. Working/iterative changes."
        
        if not source_path.exists():
            print(f"  ⚠️  Source path does not exist: {source_path}")
            return {'status': 'skipped', 'reason': 'path_not_found'}
        
        print(f"\n📚 Syncing: {kb_name}")
        print(f"   Source: {source_path}")
        
        # Get or create knowledge base
        kb_id = self.get_or_create_knowledge(kb_name, description)
        
        # Get existing files in knowledge base
        try:
            kb_info = self.client.get_knowledge(kb_id)
            files_list = kb_info.get('files') or []
            existing_files = {f['filename']: f for f in files_list}
            print(f"   Existing files in knowledge base: {len(existing_files)}")
        except Exception as e:
            print(f"   Note: Could not get existing files: {e}")
            existing_files = {}
        
        # Find all markdown files
        md_files = self.find_markdown_files(source_path, config)
        print(f"   Markdown files found: {len(md_files)}")
        
        # Track sync results
        results = {
            'uploaded': [],
            'added': [],
            'unchanged': [],
            'removed': [],
            'errors': []
        }
        
        # Process each file
        current_files = set()
        for file_path in md_files:
            relative_path = file_path.relative_to(source_path)
            current_files.add(str(relative_path))
            
            # Check if file has changed
            file_hash = self.get_file_hash(file_path)
            state_key = f"{kb_name}:{relative_path}"
            
            if state_key in self.sync_state and self.sync_state[state_key] == file_hash:
                results['unchanged'].append(str(relative_path))
                continue
            
            try:
                # Upload file via HTTP
                print(f"   ⬆️  Uploading: {relative_path}")
                upload_result = self.client.upload_file(file_path)
                file_id = upload_result.get('id')
                
                if not file_id:
                    raise Exception(f"Failed to get file ID from upload: {upload_result}")
                
                # Add to knowledge base
                self.client.add_file_to_knowledge(kb_id, file_id)
                
                # Update sync state
                self.sync_state[state_key] = file_hash
                results['uploaded'].append(str(relative_path))
                
            except Exception as e:
                print(f"   ❌ Error with {relative_path}: {e}")
                results['errors'].append({'file': str(relative_path), 'error': str(e)})
        
        # Remove files that no longer exist in source
        for filename, file_info in existing_files.items():
            # Check if this file is still in our source
            # Note: This is simplified - we might need to track file IDs better
            pass  # For now, we'll skip cleanup to be safe
        
        print(f"   ✅ Uploaded: {len(results['uploaded'])}, Unchanged: {len(results['unchanged'])}, Errors: {len(results['errors'])}")
        
        return {
            'status': 'success',
            'knowledge_id': kb_id,
            'knowledge_name': kb_name,
            'results': results
        }
    
    def sync_single_knowledge_base(self, config: KnowledgeConfig) -> Dict:
        """
        Sync a single knowledge base (no Production/Development split).
        Used for company documentation that doesn't have separate prod/dev states.
        
        Args:
            config: Knowledge configuration
        """
        source_path = Path(config.production_path)
        kb_name = config.name  # No suffix - just use the name as-is
        description = config.description or f"Documentation for {config.name}"
        
        if not source_path.exists():
            print(f"  ⚠️  Source path does not exist: {source_path}")
            return {'status': 'skipped', 'reason': 'path_not_found'}
        
        print(f"\n📚 Syncing: {kb_name}")
        print(f"   Source: {source_path}")
        
        # Get or create knowledge base
        kb_id = self.get_or_create_knowledge(kb_name, description)
        
        # Get existing files in knowledge base
        try:
            kb_info = self.client.get_knowledge(kb_id)
            files_list = kb_info.get('files') or []
            existing_files = {f['filename']: f for f in files_list}
            print(f"   Existing files in knowledge base: {len(existing_files)}")
        except Exception as e:
            print(f"   Note: Could not get existing files: {e}")
            existing_files = {}
        
        # Find all markdown files
        md_files = self.find_markdown_files(source_path, config)
        print(f"   Markdown files found: {len(md_files)}")
        
        # Track sync results
        results = {
            'uploaded': [],
            'added': [],
            'unchanged': [],
            'removed': [],
            'errors': []
        }
        
        # Process each file
        for file_path in md_files:
            relative_path = file_path.relative_to(source_path)
            
            # Check if file has changed
            file_hash = self.get_file_hash(file_path)
            state_key = f"{kb_name}:{relative_path}"
            
            if state_key in self.sync_state and self.sync_state[state_key] == file_hash:
                results['unchanged'].append(str(relative_path))
                continue
            
            try:
                # Upload file via HTTP
                print(f"   ⬆️  Uploading: {relative_path}")
                upload_result = self.client.upload_file(file_path)
                file_id = upload_result.get('id')
                
                if not file_id:
                    raise Exception(f"Failed to get file ID from upload: {upload_result}")
                
                # Add to knowledge base
                self.client.add_file_to_knowledge(kb_id, file_id)
                
                # Update sync state
                self.sync_state[state_key] = file_hash
                results['uploaded'].append(str(relative_path))
                
            except Exception as e:
                print(f"   ❌ Error with {relative_path}: {e}")
                results['errors'].append({'file': str(relative_path), 'error': str(e)})
        
        print(f"   ✅ Uploaded: {len(results['uploaded'])}, Unchanged: {len(results['unchanged'])}, Errors: {len(results['errors'])}")
        
        return {
            'status': 'success',
            'knowledge_id': kb_id,
            'knowledge_name': kb_name,
            'results': results
        }
    
    def sync_product(self, product_name: str, environments: List[str] = None) -> Dict:
        """Sync a specific product/project."""
        if product_name not in self.configs:
            raise ValueError(f"Product '{product_name}' not found in config")
        
        config = self.configs[product_name]
        
        # If single_kb is True, create only one knowledge base (no env suffix)
        if config.single_kb:
            return {'single': self.sync_single_knowledge_base(config)}
        
        environments = environments or ['production', 'development']
        
        results = {}
        for env in environments:
            results[env] = self.sync_knowledge_base(config, env)
        
        return results
    
    def sync_all(self) -> Dict:
        """Sync all configured products/projects."""
        results = {}
        for name in self.configs:
            results[name] = self.sync_product(name)
        return results
    
    def list_knowledge_bases(self):
        """List all knowledge bases in Open WebUI."""
        knowledge_list = self.client.list_knowledge()
        print(f"\n📚 Knowledge Bases in Open WebUI:")
        print("-" * 60)
        for kb in knowledge_list:
            print(f"  📁 {kb['name']}")
            print(f"     ID: {kb['id']}")
            print(f"     Description: {kb.get('description', 'N/A')}")
            # Try to get file count from a separate call
            try:
                kb_detail = self.client.get_knowledge(kb['id'])
                files = kb_detail.get('files', [])
                print(f"     Files: {len(files)}")
            except:
                pass
            print()
    
    def watch_and_sync(self, interval: int = 300):
        """Watch for file changes and sync automatically."""
        print(f"👁️  Watching for changes (interval: {interval}s)...")
        print("   Press Ctrl+C to stop")
        
        try:
            while True:
                print(f"\n🔄 Auto-sync at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                self.sync_all()
                self.save_sync_state()
                print(f"   Next sync in {interval}s...")
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n👋 Stopping watcher")
            self.save_sync_state()
    
    def cleanup_duplicate_knowledge_bases(self, dry_run: bool = True) -> List[str]:
        """
        Remove duplicate Production/Development knowledge bases for companies
        that are now configured as single_kb.
        
        Args:
            dry_run: If True, only show what would be deleted without actually deleting
            
        Returns:
            List of deleted (or would-be-deleted) knowledge base names
        """
        # Find all single_kb configs
        single_kb_names = [name for name, config in self.configs.items() if config.single_kb]
        
        if not single_kb_names:
            print("No single_kb configurations found.")
            return []
        
        print(f"\n🧹 Cleaning up duplicate knowledge bases for: {', '.join(single_kb_names)}")
        print("-" * 60)
        
        # Get all knowledge bases from Open WebUI
        all_knowledge = self.client.list_knowledge()
        
        deleted = []
        for kb in all_knowledge:
            kb_name = kb['name']
            
            # Check if this KB matches "Name - Production" or "Name - Development"
            # where "Name" is a single_kb config
            for single_name in single_kb_names:
                prod_suffix = f"{single_name} - Production"
                dev_suffix = f"{single_name} - Development"
                
                if kb_name == prod_suffix or kb_name == dev_suffix:
                    action = "Would delete" if dry_run else "Deleting"
                    print(f"  {action}: {kb_name} (ID: {kb['id']})")
                    
                    if not dry_run:
                        try:
                            self.client.delete_knowledge(kb['id'])
                            print(f"    ✅ Deleted successfully")
                        except Exception as e:
                            print(f"    ❌ Error deleting: {e}")
                            continue
                    
                    deleted.append(kb_name)
        
        if not deleted:
            print("  No duplicate knowledge bases found.")
        else:
            mode_str = "(dry run - no changes made)" if dry_run else ""
            print(f"\n  Total: {len(deleted)} knowledge bases {'would be ' if dry_run else ''}deleted {mode_str}")
            print(f"  Run with --execute to actually delete.")
        
        return deleted


def create_sample_config():
    """Create a sample configuration file."""
    sample = {
        'products': [
            {
                'name': 'SYNAPTICA',
                'production_path': '/Users/sesloan/repos/thalamus-ai/SYNAPTICA/docs/master-production',
                'development_path': '/Users/sesloan/repos/thalamus-ai/SYNAPTICA/docs/master-development',
                'obsidian_prod_path': '/Users/sesloan/Documents/Obsidian Vault/Thalamus/02-PRODUCTS/SYNAPTICA/master',
                'obsidian_dev_path': '/Users/sesloan/Documents/Obsidian Vault/Thalamus/06-PROJECTS/SYNAPTICA/master',
                'description': 'AI Product Context Manager - system architecture and documentation',
                'file_patterns': ['**/*.md', '**/*.mdx'],
                'exclude_patterns': ['.git', 'node_modules', '__pycache__', '.obsidian']
            }
        ]
    }
    return sample


def main():
    parser = argparse.ArgumentParser(
        description='Sync documentation to Open WebUI Knowledge Bases (Auto-discovery enabled)'
    )
    parser.add_argument('--config', '-c', default=None,
                       help='Path to configuration YAML file (optional with auto-discovery)')
    parser.add_argument('--no-discover', action='store_true',
                       help='Disable auto-discovery (use explicit config only)')
    parser.add_argument('--api-url', default='http://localhost:3115',
                       help='Open WebUI base URL')
    parser.add_argument('--api-key', default=os.getenv('OPEN_WEBUI_API_KEY'),
                       help='Open WebUI API key (or set OPEN_WEBUI_API_KEY env var)')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Sync command
    sync_parser = subparsers.add_parser('sync', help='Sync knowledge bases')
    sync_parser.add_argument('--product', '-p', help='Sync specific product only')
    sync_parser.add_argument('--env', '-e', choices=['production', 'development', 'both'],
                            default='both', help='Environment to sync')
    
    # List command
    subparsers.add_parser('list', help='List all knowledge bases')
    
    # Watch command
    watch_parser = subparsers.add_parser('watch', help='Watch for changes and auto-sync')
    watch_parser.add_argument('--interval', '-i', type=int, default=300,
                             help='Sync interval in seconds (default: 300)')
    
    # Init command
    init_parser = subparsers.add_parser('init', help='Create sample configuration')
    init_parser.add_argument('--output', '-o', default='products.yaml',
                            help='Output config file path')
    
    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='Remove duplicate knowledge bases for single_kb configs')
    cleanup_parser.add_argument('--execute', action='store_true',
                               help='Actually delete (default is dry-run)')
    
    # Discover command (new)
    subparsers.add_parser('discover', help='Show what would be synced (dry-run)')
    
    args = parser.parse_args()
    
    if not args.api_key:
        print("❌ Error: API key required. Set OPEN_WEBUI_API_KEY environment variable or use --api-key")
        sys.exit(1)
    
    # Handle init command
    if args.command == 'init':
        sample = create_sample_config()
        with open(args.output, 'w') as f:
            yaml.dump(sample, f, default_flow_style=False, sort_keys=False)
        print(f"✅ Sample configuration created: {args.output}")
        print("   Edit this file to add your products/projects")
        return
    
    # Initialize client
    client = OpenWebUIClient(args.api_url, args.api_key)
    
    # Initialize sync manager
    sync = KnowledgeSync(client, args.config)
    
    # Load configs (with or without auto-discovery)
    auto_discover = not args.no_discover
    sync.load_all_configs(auto_discover=auto_discover)
    
    # Execute command
    if args.command == 'discover':
        print("\n🔍 Discovery complete. Found these knowledge bases to sync:")
        print("-" * 60)
        for name, config in sorted(sync.configs.items()):
            if config.single_kb:
                print(f"  📁 {name} (Company - single KB)")
                print(f"     Source: {config.production_path}")
            else:
                print(f"  📁 {name} - Production")
                print(f"     Source: {config.production_path}")
                if config.development_path != config.production_path:
                    print(f"  📁 {name} - Development")
                    print(f"     Source: {config.development_path}")
        print("-" * 60)
        print(f"\nRun './kb-sync sync' to sync all, or './kb-sync sync -p <name>' for specific")
    
    elif args.command == 'list' or args.command is None:
        sync.list_knowledge_bases()
    
    elif args.command == 'sync':
        environments = []
        if args.env in ['production', 'both']:
            environments.append('production')
        if args.env in ['development', 'both']:
            environments.append('development')
        
        if args.product:
            if args.product not in sync.configs:
                print(f"❌ Error: Product '{args.product}' not found")
                print(f"   Available: {', '.join(sorted(sync.configs.keys()))}")
                sys.exit(1)
            results = sync.sync_product(args.product, environments)
        else:
            results = sync.sync_all()
        
        sync.save_sync_state()
        print("\n✅ Sync complete!")
    
    elif args.command == 'watch':
        sync.watch_and_sync(args.interval)
    
    elif args.command == 'cleanup':
        sync.cleanup_duplicate_knowledge_bases(dry_run=not args.execute)


if __name__ == '__main__':
    main()
