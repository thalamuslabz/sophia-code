#!/usr/bin/env python3
"""
End-to-End Sync Orchestrator

Automatically discovers and syncs:
1. Git repos → Obsidian Vault (bidirectional)
2. Git repos → Open WebUI Knowledge Bases
3. Company docs → Obsidian Vault (bidirectional)
4. Company docs → Open WebUI Knowledge Bases

Usage:
  python e2e_sync.py --discover          # Discover new sources
  python e2e_sync.py --sync              # Full sync everything
  python e2e_sync.py --watch             # Watch mode (auto-detect changes)
"""

import os
import sys
import yaml
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import argparse

# Paths
REPO_BASE = Path.home() / "repos"
COMPANIES_BASE = Path.home() / "Documents/companies"
OBSIDIAN_BASE = Path.home() / "Documents/Obsidian Vault"
SOPHIA_CODE = Path.home() / "sophia-code"

# Known orgs
REPO_ORGS = ["thalamus-ai", "cortex-digital", "hype-local", "thalamus-labz"]

# Obsidian folder mapping
ORG_TO_OBSIDIAN = {
    "thalamus-ai": "thalamus-ai",
    "cortex-digital": "cortex-digital",
    "hype-local": "hype-local",
    "thalamus-labz": "thalamus-labz",
}

COMPANY_TO_OBSIDIAN = {
    "Thalamus": "thalamus-ai",
    "Cortex Digital": "cortex-digital",
    "Hype Local": "hype-local",
    "Thalamus Labz": "thalamus-labz",
}


@dataclass
class DiscoveredSource:
    """Represents a discovered sync source."""
    name: str
    source_type: str  # 'repo-project', 'company'
    source_path: Path
    obsidian_target: Path
    has_production: bool
    has_development: bool


class E2ESyncOrchestrator:
    """Orchestrates end-to-end sync across all systems."""
    
    def __init__(self, dry_run: bool = False, api_key: str = None):
        self.dry_run = dry_run
        self.api_key = api_key or os.getenv('OPEN_WEBUI_API_KEY')
        self.discovered = []
        
    def log(self, message: str, level: str = "INFO"):
        """Print log message."""
        prefix = "[DRY-RUN] " if self.dry_run else ""
        print(f"{prefix}{level}: {message}")
    
    # ============ DISCOVERY ============
    
    def discover_repo_projects(self, org_name: str) -> List[DiscoveredSource]:
        """Discover projects in a repo org with docs folders."""
        sources = []
        org_path = REPO_BASE / org_name
        
        if not org_path.exists():
            return sources
        
        obsidian_folder = ORG_TO_OBSIDIAN.get(org_name, org_name)
        
        for item in org_path.iterdir():
            if not item.is_dir() or item.name.startswith('.'):
                continue
            
            # Check for docs folders
            prod_path = item / "docs/master-production"
            dev_path = item / "docs/master-development"
            
            has_prod = prod_path.exists() and any(prod_path.iterdir())
            has_dev = dev_path.exists() and any(dev_path.iterdir())
            
            if has_prod or has_dev:
                source = DiscoveredSource(
                    name=f"{org_name}/{item.name}",
                    source_type="repo-project",
                    source_path=item,
                    obsidian_target=OBSIDIAN_BASE / obsidian_folder,
                    has_production=has_prod,
                    has_development=has_dev
                )
                sources.append(source)
        
        return sources
    
    def discover_companies(self) -> List[DiscoveredSource]:
        """Discover companies with docs/master folders."""
        sources = []
        
        if not COMPANIES_BASE.exists():
            return sources
        
        for company_name, obsidian_folder in COMPANY_TO_OBSIDIAN.items():
            company_path = COMPANIES_BASE / company_name
            docs_path = company_path / "docs/master"
            
            if docs_path.exists() and any(docs_path.iterdir()):
                source = DiscoveredSource(
                    name=f"companies/{company_name}",
                    source_type="company",
                    source_path=company_path,
                    obsidian_target=OBSIDIAN_BASE / obsidian_folder,
                    has_production=True,
                    has_development=False
                )
                sources.append(source)
        
        return sources
    
    def discover_all(self) -> List[DiscoveredSource]:
        """Discover all sync sources."""
        self.log("🔍 Discovering sync sources...")
        all_sources = []
        
        # Discover repo projects
        for org in REPO_ORGS:
            sources = self.discover_repo_projects(org)
            all_sources.extend(sources)
            if sources:
                self.log(f"  Found {len(sources)} projects in {org}")
        
        # Discover companies
        company_sources = self.discover_companies()
        all_sources.extend(company_sources)
        if company_sources:
            self.log(f"  Found {len(company_sources)} companies")
        
        self.discovered = all_sources
        self.log(f"✅ Total sources discovered: {len(all_sources)}")
        return all_sources
    
    # ============ OBSIDIAN SETUP ============
    
    def ensure_obsidian_structure(self, source: DiscoveredSource) -> bool:
        """Ensure Obsidian folder structure exists for a source."""
        obsidian_folder = source.obsidian_target
        created = False
        
        # Create main vault folder if needed
        if not obsidian_folder.exists():
            if self.dry_run:
                self.log(f"Would create: {obsidian_folder}")
            else:
                obsidian_folder.mkdir(parents=True, exist_ok=True)
                self.log(f"Created: {obsidian_folder}")
            created = True
        
        # Create structure based on source type
        if source.source_type == "repo-project":
            # Production → 02-PRODUCTS
            if source.has_production:
                prod_target = obsidian_folder / "02-PRODUCTS" / source.source_path.name / "master"
                if not prod_target.exists():
                    if self.dry_run:
                        self.log(f"Would create: {prod_target}")
                    else:
                        prod_target.mkdir(parents=True, exist_ok=True)
                        self.log(f"Created: {prod_target}")
                    created = True
            
            # Development → 06-PROJECTS
            if source.has_development:
                dev_target = obsidian_folder / "06-PROJECTS" / source.source_path.name / "master"
                if not dev_target.exists():
                    if self.dry_run:
                        self.log(f"Would create: {dev_target}")
                    else:
                        dev_target.mkdir(parents=True, exist_ok=True)
                        self.log(f"Created: {dev_target}")
                    created = True
        
        elif source.source_type == "company":
            # Company → 02-PRODUCTS/Company
            company_target = obsidian_folder / "02-PRODUCTS" / "Company" / "master"
            if not company_target.exists():
                if self.dry_run:
                    self.log(f"Would create: {company_target}")
                else:
                    company_target.mkdir(parents=True, exist_ok=True)
                    self.log(f"Created: {company_target}")
                created = True
        
        return created
    
    # ============ KNOWLEDGE BASE SETUP ============
    
    def update_knowledge_config(self, source: DiscoveredSource) -> bool:
        """Update products.yaml for Open WebUI knowledge sync."""
        config_path = SOPHIA_CODE / "tools/knowledge-sync/products.yaml"
        
        if not config_path.exists():
            self.log(f"Config not found: {config_path}", "WARN")
            return False
        
        # Load existing config
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f) or {'products': []}
        
        existing_names = {p['name'] for p in config['products']}
        
        # Generate config entry name
        if source.source_type == "repo-project":
            kb_name = source.source_path.name  # Just project name
        else:
            kb_name = source.source_path.name.replace(' ', '') + "-Company"
        
        if kb_name in existing_names:
            return False  # Already configured
        
        # Build config entry
        if source.source_type == "repo-project":
            entry = {
                'name': kb_name,
                'production_path': str(source.source_path / "docs/master-production"),
                'development_path': str(source.source_path / "docs/master-development"),
                'obsidian_prod_path': str(source.obsidian_target / "02-PRODUCTS" / source.source_path.name / "master"),
                'obsidian_dev_path': str(source.obsidian_target / "06-PROJECTS" / source.source_path.name / "master"),
                'description': f"{source.source_path.name} documentation",
                'file_patterns': ['**/*.md', '**/*.mdx'],
                'exclude_patterns': ['.git', 'node_modules', '__pycache__', '.obsidian', '*.tmp']
            }
        else:  # company
            docs_path = source.source_path / "docs/master"
            entry = {
                'name': kb_name,
                'production_path': str(docs_path),
                'development_path': str(docs_path),
                'obsidian_prod_path': str(source.obsidian_target / "02-PRODUCTS" / "Company" / "master"),
                'obsidian_dev_path': str(source.obsidian_target / "02-PRODUCTS" / "Company" / "master"),
                'description': f"{source.source_path.name} company documentation",
                'file_patterns': ['**/*.md', '**/*.mdx', '**/*.txt'],
                'exclude_patterns': ['.git', 'node_modules', '__pycache__', '.obsidian', '*.tmp']
            }
        
        if self.dry_run:
            self.log(f"Would add to products.yaml: {kb_name}")
            return True
        
        # Add to config
        config['products'].append(entry)
        
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False, sort_keys=False)
        
        self.log(f"Added to products.yaml: {kb_name}")
        return True
    
    # ============ SYNC EXECUTION ============
    
    def run_repo_obsidian_sync(self) -> bool:
        """Run the repo-obsidian sync script."""
        script_dir = SOPHIA_CODE / "tools/repo-obsidian-sync"
        script = script_dir / "repo_obsidian_sync.py"
        
        if not script.exists():
            self.log(f"Script not found: {script}", "ERROR")
            return False
        
        cmd = ["python3", str(script)]
        if self.dry_run:
            cmd.append("--dry-run")
        
        self.log(f"Running: {' '.join(cmd)}")
        
        if self.dry_run:
            return True
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300, cwd=str(script_dir))
            if result.returncode != 0:
                self.log(f"Sync error: {result.stderr}", "ERROR")
                return False
            return True
        except Exception as e:
            self.log(f"Sync failed: {e}", "ERROR")
            return False
    
    def run_knowledge_sync(self) -> bool:
        """Run the Open WebUI knowledge sync."""
        script = SOPHIA_CODE / "tools/knowledge-sync/knowledge_sync.py"
        config = SOPHIA_CODE / "tools/knowledge-sync/products.yaml"
        
        if not script.exists():
            self.log(f"Script not found: {script}", "ERROR")
            return False
        
        cmd = ["python3", str(script), "--config", str(config), "sync"]
        
        self.log(f"Running: {' '.join(cmd)}")
        
        if self.dry_run:
            return True
        
        env = os.environ.copy()
        env['OPEN_WEBUI_API_KEY'] = self.api_key or ''
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300, env=env, cwd=str(SOPHIA_CODE / "tools/knowledge-sync"))
            if result.returncode != 0:
                self.log(f"Knowledge sync error: {result.stderr}", "ERROR")
                return False
            return True
        except Exception as e:
            self.log(f"Knowledge sync failed: {e}", "ERROR")
            return False
    
    # ============ MAIN WORKFLOW ============
    
    def setup_new_source(self, source: DiscoveredSource) -> bool:
        """Full setup for a new source."""
        self.log(f"\n🆕 Setting up: {source.name}")
        
        # 1. Create Obsidian structure
        created = self.ensure_obsidian_structure(source)
        if created:
            self.log(f"✅ Created Obsidian structure")
        
        # 2. Update knowledge config
        config_added = self.update_knowledge_config(source)
        if config_added:
            self.log(f"✅ Added to knowledge config")
        
        return created or config_added
    
    def sync_all(self, discover: bool = True):
        """Full end-to-end sync."""
        if discover:
            self.discover_all()
        
        if not self.discovered:
            self.log("No sources to sync")
            return
        
        # Setup any new sources
        new_sources = []
        for source in self.discovered:
            if self.setup_new_source(source):
                new_sources.append(source)
        
        if new_sources:
            self.log(f"\n🆕 {len(new_sources)} new sources configured")
        
        # Run repo-to-obsidian sync
        self.log("\n🔄 Running repo-to-obsidian sync...")
        self.run_repo_obsidian_sync()
        
        # Run Open WebUI knowledge sync
        self.log("\n🧠 Running Open WebUI knowledge sync...")
        self.run_knowledge_sync()
        
        self.log("\n✅ End-to-end sync complete!")
    
    def watch_mode(self):
        """Watch for changes and sync automatically."""
        import time
        
        self.log("👁️  Watch mode started (checking every 5 minutes)...")
        self.log("Press Ctrl+C to stop")
        
        try:
            while True:
                self.log(f"\n{'='*60}")
                self.log(f"Auto-sync at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                self.sync_all(discover=True)
                self.log(f"Next check in 5 minutes...")
                time.sleep(300)
        except KeyboardInterrupt:
            self.log("\n👋 Stopping watch mode")


def main():
    parser = argparse.ArgumentParser(
        description='End-to-End Sync: Repo → Obsidian → Open WebUI'
    )
    parser.add_argument('--discover', '-d', action='store_true',
                       help='Discover and list all sources')
    parser.add_argument('--sync', '-s', action='store_true',
                       help='Run full sync')
    parser.add_argument('--watch', '-w', action='store_true',
                       help='Watch mode (auto-sync)')
    parser.add_argument('--dry-run', '-n', action='store_true',
                       help='Show what would happen without making changes')
    parser.add_argument('--api-key',
                       help='Open WebUI API key (or set OPEN_WEBUI_API_KEY env var)')
    
    args = parser.parse_args()
    
    orchestrator = E2ESyncOrchestrator(
        dry_run=args.dry_run,
        api_key=args.api_key
    )
    
    if args.discover:
        sources = orchestrator.discover_all()
        print("\n📋 Discovered Sources:")
        print("=" * 70)
        for s in sources:
            prod = "P" if s.has_production else " "
            dev = "D" if s.has_development else " "
            print(f"  [{prod}{dev}] {s.name:<40} ({s.source_type})")
        print("=" * 70)
    
    elif args.sync:
        orchestrator.sync_all(discover=True)
    
    elif args.watch:
        orchestrator.watch_mode()
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
