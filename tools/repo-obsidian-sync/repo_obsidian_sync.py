#!/usr/bin/env python3
"""
Repo-to-Obsidian Vault Sync Tool

Scans Git repositories for docs/master-production and docs/master-development folders
and bidirectionally syncs them with Obsidian Vault.

Monitored Repos:
  - thalamus-ai     → Obsidian: thalamus-ai
  - cortex-digital  → Obsidian: cortex-digital  
  - hype-local      → Obsidian: hype-local
  - thalamus-labz   → Obsidian: thalamus-labz

Sync Rules:
  - docs/master-production/  →  02-PRODUCTS/{repo}/master/
  - docs/master-development/ →  06-PROJECTS/{repo}/master/

Usage:
  python repo_obsidian_sync.py              # Run sync once
  python repo_obsidian_sync.py --daemon     # Run continuously
  python repo_obsidian_sync.py --status     # Show sync status
  python repo_obsidian_sync.py --force      # Force full re-sync
"""

import os
import sys
import json
import hashlib
import shutil
import argparse
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict
import fnmatch


# Configuration
REPO_BASE = Path.home() / "repos"
COMPANIES_BASE = Path.home() / "Documents/companies"
OBSIDIAN_BASE = Path.home() / "Documents/Obsidian Vault"
STATE_FILE = Path.home() / ".repo_obsidian_sync_state.json"
LOG_FILE = Path.home() / "logs/repo-obsidian-sync.log"

# Repo organizations to monitor
# Each org contains multiple projects with docs/master-production and docs/master-development
REPO_ORGS = ["thalamus-ai", "cortex-digital", "hype-local", "thalamus-labz"]

# Companies to monitor (for docs/master folder)
# Maps company folder name to obsidian vault folder
COMPANY_MAPPING = {
    "Thalamus": "thalamus-ai",
    "Cortex Digital": "cortex-digital",
    "Hype Local": "hype-local",
    "Thalamus Labz": "thalamus-labz",
}

# Obsidian vault folder mapping
OBSIDIAN_FOLDERS = {
    "thalamus-ai": "thalamus-ai",
    "cortex-digital": "cortex-digital",
    "hype-local": "hype-local",
    "thalamus-labz": "thalamus-labz",
}

# File patterns to sync
SYNC_PATTERNS = ["**/*.md", "**/*.mdx", "**/*.txt"]

# Patterns to ignore
IGNORE_PATTERNS = [
    ".git",
    ".gitignore", 
    "__pycache__",
    ".obsidian",
    "node_modules",
    "*.tmp",
    "*.temp",
    ".DS_Store",
    "Thumbs.db",
]


@dataclass
class SyncEntry:
    """Represents a file to be synced."""
    source_path: Path
    target_path: Path
    file_hash: str
    mtime: float
    size: int
    direction: str  # 'repo-to-obsidian', 'obsidian-to-repo', or 'conflict'


@dataclass
class SyncResult:
    """Result of a sync operation."""
    repo_name: str
    environment: str  # 'production' or 'development'
    files_synced: int
    files_skipped: int
    files_conflicted: int
    errors: List[str]
    timestamp: str


class RepoObsidianSync:
    """Main sync orchestrator."""
    
    def __init__(self, dry_run: bool = False, force: bool = False):
        self.dry_run = dry_run
        self.force = force
        self.state = self.load_state()
        self.setup_logging()
        
    def setup_logging(self):
        """Configure logging."""
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(LOG_FILE),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def load_state(self) -> Dict:
        """Load sync state from JSON file."""
        if STATE_FILE.exists():
            try:
                with open(STATE_FILE, 'r') as f:
                    return json.load(f)
            except Exception as e:
                self.logger.warning(f"Could not load state file: {e}")
        return {"files": {}, "last_sync": {}}
    
    def save_state(self):
        """Save sync state to JSON file."""
        try:
            with open(STATE_FILE, 'w') as f:
                json.dump(self.state, f, indent=2, default=str)
        except Exception as e:
            self.logger.error(f"Could not save state file: {e}")
    
    def get_file_hash(self, filepath: Path) -> str:
        """Calculate MD5 hash of file content."""
        try:
            with open(filepath, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return ""
    
    def should_ignore(self, filepath: Path) -> bool:
        """Check if file should be ignored."""
        path_str = str(filepath)
        for pattern in IGNORE_PATTERNS:
            if fnmatch.fnmatch(path_str, f"*{pattern}*"):
                return True
        return False
    
    def find_files(self, directory: Path) -> List[Path]:
        """Find all files matching sync patterns in directory."""
        if not directory.exists():
            return []
        
        files = []
        for pattern in SYNC_PATTERNS:
            files.extend(directory.glob(pattern))
        
        # Filter out ignored files and return unique sorted list
        return sorted(set(f for f in files if not self.should_ignore(f)))
    
    def get_sync_action(self, source_file: Path, target_file: Path) -> str:
        """
        Determine sync action based on file states.
        Returns: 'repo-to-obsidian', 'obsidian-to-repo', 'skip', 'conflict'
        """
        source_exists = source_file.exists()
        target_exists = target_file.exists()
        
        # Neither exists - nothing to do
        if not source_exists and not target_exists:
            return 'skip'
        
        # Source deleted, target exists - delete target (sync deletion)
        if not source_exists and target_exists:
            return 'delete-target'
        
        # Target deleted, source exists - delete source (sync deletion)
        if source_exists and not target_exists:
            state_key = f"{source_file}:{target_file}"
            if state_key in self.state['files']:
                return 'delete-source'
            else:
                # Target never existed - copy source to target
                return 'repo-to-obsidian'
        
        # Both exist - compare hashes
        source_hash = self.get_file_hash(source_file)
        target_hash = self.get_file_hash(target_file)
        
        if source_hash == target_hash:
            return 'skip'  # Files are identical
        
        # Files differ - check timestamps
        source_mtime = source_file.stat().st_mtime
        target_mtime = target_file.stat().st_mtime
        
        if source_mtime > target_mtime:
            return 'repo-to-obsidian'
        elif target_mtime > source_mtime:
            return 'obsidian-to-repo'
        else:
            return 'conflict'  # Same timestamp, different content
    
    def sync_file(self, source: Path, target: Path, action: str) -> bool:
        """Execute sync action for a single file."""
        try:
            if action == 'skip':
                return True
            
            if action == 'delete-target':
                if self.dry_run:
                    self.logger.info(f"[DRY-RUN] Would delete: {target}")
                else:
                    target.unlink()
                    self.logger.info(f"Deleted: {target}")
                return True
            
            if action == 'delete-source':
                if self.dry_run:
                    self.logger.info(f"[DRY-RUN] Would delete: {source}")
                else:
                    source.unlink()
                    self.logger.info(f"Deleted: {source}")
                return True
            
            # Copy operations
            if action in ['repo-to-obsidian', 'obsidian-to-repo']:
                src = source if action == 'repo-to-obsidian' else target
                dst = target if action == 'repo-to-obsidian' else source
                
                if self.dry_run:
                    self.logger.info(f"[DRY-RUN] Would copy: {src} -> {dst}")
                else:
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dst)
                    direction = "Repo → Obsidian" if action == 'repo-to-obsidian' else "Obsidian → Repo"
                    self.logger.info(f"{direction}: {dst.name}")
                
                # Update state
                state_key = f"{source}:{target}"
                self.state['files'][state_key] = {
                    'hash': self.get_file_hash(src),
                    'mtime': src.stat().st_mtime,
                    'last_sync': datetime.now().isoformat()
                }
                return True
            
            if action == 'conflict':
                self.logger.warning(f"Conflict: {source.name} (manual resolution needed)")
                return False
            
        except Exception as e:
            self.logger.error(f"Error syncing {source}: {e}")
            return False
        
        return True
    
    def find_projects(self, org_name: str) -> List[Path]:
        """Find all projects under an org that have docs/ folders."""
        org_path = REPO_BASE / org_name
        if not org_path.exists():
            return []
        
        projects = []
        for item in org_path.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                # Check if it has docs/master-production or docs/master-development
                if (item / "docs/master-production").exists() or (item / "docs/master-development").exists():
                    projects.append(item)
        
        return sorted(projects)
    
    def sync_project_environment(self, org_name: str, project_path: Path, environment: str) -> SyncResult:
        """
        Sync a specific project's environment (production or development).
        """
        obsidian_folder = OBSIDIAN_FOLDERS.get(org_name, org_name)
        project_name = project_path.name
        
        # Determine source and target paths
        if environment == 'production':
            source_dir = project_path / "docs/master-production"
            target_dir = OBSIDIAN_BASE / obsidian_folder / "02-PRODUCTS" / project_name / "master"
        else:
            source_dir = project_path / "docs/master-development"
            target_dir = OBSIDIAN_BASE / obsidian_folder / "06-PROJECTS" / project_name / "master"
        
        repo_name = f"{org_name}/{project_name}"
        
        self.logger.info(f"\n{'='*60}")
        self.logger.info(f"Syncing: {org_name}/{project_name} - {environment}")
        self.logger.info(f"Source: {source_dir}")
        self.logger.info(f"Target: {target_dir}")
        self.logger.info(f"{'='*60}")
        
        # Check if source exists
        if not source_dir.exists():
            self.logger.debug(f"Source directory does not exist: {source_dir}")
            return SyncResult(repo_name, environment, 0, 0, 0, [], datetime.now().isoformat())
        
        return self._sync_directory(source_dir, target_dir, repo_name, environment)
    
    def find_company_docs(self, company_name: str) -> Optional[Path]:
        """Find docs/master folder for a company."""
        company_path = COMPANIES_BASE / company_name / "docs" / "master"
        if company_path.exists():
            return company_path
        return None
    
    def sync_company_docs(self, company_name: str, obsidian_folder: str) -> SyncResult:
        """Sync company docs/master folder to Obsidian."""
        source_dir = self.find_company_docs(company_name)
        
        if not source_dir:
            return SyncResult(
                f"companies/{company_name}",
                "master",
                0, 0, 0,
                ["Company docs not found"],
                datetime.now().isoformat()
            )
        
        target_dir = OBSIDIAN_BASE / obsidian_folder / "01-COMPANY" / "master"
        
        self.logger.info(f"\n{'='*60}")
        self.logger.info(f"Syncing: companies/{company_name} - master")
        self.logger.info(f"Source: {source_dir}")
        self.logger.info(f"Target: {target_dir}")
        self.logger.info(f"{'='*60}")
        
        return self._sync_directory(source_dir, target_dir, f"companies/{company_name}", "master")
    
    def _sync_directory(self, source_dir: Path, target_dir: Path, repo_name: str, environment: str) -> SyncResult:
        """Generic directory sync logic."""
        # Find all files in source
        source_files = self.find_files(source_dir)
        target_files = self.find_files(target_dir) if target_dir.exists() else []
        
        # Create file mappings
        source_map = {f.relative_to(source_dir): f for f in source_files}
        target_map = {f.relative_to(target_dir): f for f in target_files} if target_dir.exists() else {}
        
        # Track all relative paths
        all_paths = set(source_map.keys()) | set(target_map.keys())
        
        synced = 0
        skipped = 0
        conflicted = 0
        errors = []
        
        for rel_path in sorted(all_paths):
            source_file = source_map.get(rel_path)
            target_file = target_map.get(rel_path)
            
            if target_file is None and source_file is not None:
                target_file = target_dir / rel_path
            
            if source_file is None and target_file is not None:
                source_file = source_dir / rel_path
            
            if self.force:
                action = 'repo-to-obsidian' if source_file and source_file.exists() else 'skip'
            else:
                action = self.get_sync_action(source_file, target_file)
            
            success = self.sync_file(source_file, target_file, action)
            
            if action == 'skip':
                skipped += 1
            elif action == 'conflict':
                conflicted += 1
            elif success:
                synced += 1
            else:
                errors.append(str(rel_path))
        
        result = SyncResult(
            repo_name=repo_name,
            environment=environment,
            files_synced=synced,
            files_skipped=skipped,
            files_conflicted=conflicted,
            errors=errors,
            timestamp=datetime.now().isoformat()
        )
        
        if source_dir.exists() or synced > 0:
            self.state['last_sync'][f"{repo_name}:{environment}"] = datetime.now().isoformat()
        
        return result
    
    def sync_all(self) -> List[SyncResult]:
        """Sync all configured orgs, projects, and company docs."""
        results = []
        
        # Sync Git repos
        for org_name in REPO_ORGS:
            org_path = REPO_BASE / org_name
            if not org_path.exists():
                self.logger.warning(f"Organization not found: {org_path}")
                continue
            
            projects = self.find_projects(org_name)
            
            if projects:
                self.logger.info(f"\n📁 Found {len(projects)} projects in {org_name}")
                
                for project_path in projects:
                    result_prod = self.sync_project_environment(org_name, project_path, 'production')
                    results.append(result_prod)
                    
                    result_dev = self.sync_project_environment(org_name, project_path, 'development')
                    results.append(result_dev)
        
        # Sync Company docs
        self.logger.info(f"\n📁 Scanning company docs...")
        for company_name, obsidian_folder in COMPANY_MAPPING.items():
            result = self.sync_company_docs(company_name, obsidian_folder)
            results.append(result)
        
        return results
    
    def print_summary(self, results: List[SyncResult]):
        """Print sync summary."""
        self.logger.info("\n" + "="*60)
        self.logger.info("SYNC SUMMARY")
        self.logger.info("="*60)
        
        total_synced = sum(r.files_synced for r in results)
        total_skipped = sum(r.files_skipped for r in results)
        total_conflicts = sum(r.files_conflicted for r in results)
        total_errors = sum(len(r.errors) for r in results)
        
        for result in results:
            if result.files_synced > 0 or result.files_conflicted > 0 or result.errors:
                self.logger.info(f"\n{result.repo_name} - {result.environment}:")
                self.logger.info(f"  Synced: {result.files_synced}")
                self.logger.info(f"  Skipped: {result.files_skipped}")
                self.logger.info(f"  Conflicts: {result.files_conflicted}")
                if result.errors:
                    self.logger.info(f"  Errors: {len(result.errors)}")
        
        self.logger.info("\n" + "-"*60)
        self.logger.info(f"Total synced: {total_synced}")
        self.logger.info(f"Total skipped (unchanged): {total_skipped}")
        self.logger.info(f"Total conflicts: {total_conflicts}")
        self.logger.info(f"Total errors: {total_errors}")
        self.logger.info("="*60)
    
    def watch(self, interval: int = 300):
        """Watch for changes and sync automatically."""
        self.logger.info(f"👁️  Watching for changes (interval: {interval}s)...")
        self.logger.info("   Press Ctrl+C to stop")
        
        try:
            while True:
                self.logger.info(f"\n{'='*60}")
                self.logger.info(f"Auto-sync at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                self.logger.info(f"{'='*60}")
                
                results = self.sync_all()
                self.print_summary(results)
                self.save_state()
                
                self.logger.info(f"\n   Next sync in {interval}s...")
                import time
                time.sleep(interval)
                
        except KeyboardInterrupt:
            self.logger.info("\n👋 Stopping watcher")
            self.save_state()


def main():
    parser = argparse.ArgumentParser(
        description='Sync Git repository docs with Obsidian Vault'
    )
    parser.add_argument('--dry-run', '-n', action='store_true',
                       help='Show what would be synced without making changes')
    parser.add_argument('--force', '-f', action='store_true',
                       help='Force full re-sync (repo → obsidian)')
    parser.add_argument('--watch', '-w', action='store_true',
                       help='Watch for changes and auto-sync')
    parser.add_argument('--interval', '-i', type=int, default=300,
                       help='Watch interval in seconds (default: 300)')
    parser.add_argument('--repo', '-r', type=str,
                       help='Sync only specific repo')
    parser.add_argument('--status', '-s', action='store_true',
                       help='Show sync status')
    
    args = parser.parse_args()
    
    sync = RepoObsidianSync(dry_run=args.dry_run, force=args.force)
    
    if args.status:
        print("\n📊 Sync Status")
        print("-" * 60)
        for key, timestamp in sync.state.get('last_sync', {}).items():
            print(f"  {key}: {timestamp}")
        print("-" * 60)
        return
    
    if args.watch:
        sync.watch(interval=args.interval)
    else:
        if args.repo:
            # Parse org/project format
            if '/' in args.repo:
                org_name, project_name = args.repo.split('/', 1)
                project_path = REPO_BASE / org_name / project_name
                if project_path.exists():
                    results = [
                        sync.sync_project_environment(org_name, project_path, 'production'),
                        sync.sync_project_environment(org_name, project_path, 'development')
                    ]
                else:
                    print(f"❌ Project not found: {project_path}")
                    sys.exit(1)
            else:
                # Sync all projects in an org
                org_path = REPO_BASE / args.repo
                if org_path.exists():
                    projects = sync.find_projects(args.repo)
                    results = []
                    for project_path in projects:
                        results.append(sync.sync_project_environment(args.repo, project_path, 'production'))
                        results.append(sync.sync_project_environment(args.repo, project_path, 'development'))
                else:
                    print(f"❌ Organization not found: {org_path}")
                    sys.exit(1)
        else:
            # Sync all repos
            results = sync.sync_all()
        
        sync.print_summary(results)
        sync.save_state()


if __name__ == '__main__':
    main()
