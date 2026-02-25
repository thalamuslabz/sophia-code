#!/usr/bin/env python3
"""
Direct sync to Open WebUI database (bypassing API authentication issues)
"""
import sqlite3
import json
import hashlib
from pathlib import Path
from datetime import datetime
import uuid

def get_file_hash(file_path):
    """Get SHA256 hash of file content"""
    try:
        with open(file_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception:
        return None

def add_file_to_db(db_path, file_path, knowledge_id):
    """Add a file to the Open WebUI database and link it to a knowledge base"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Generate file ID
    file_id = str(uuid.uuid4())
    
    # Get file info
    file_name = file_path.name
    file_size = file_path.stat().st_size
    file_hash = get_file_hash(file_path)[:16]  # Just use first 16 chars
    
    # Read file content
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ❌ Error reading {file_path}: {e}")
        return False
    
    # Create meta JSON
    meta = {
        "name": file_name,
        "content_type": "text/markdown",
        "size": file_size,
        "path": str(file_path)
    }
    
    # Check if file already exists (by hash check via filename in meta)
    cursor.execute("SELECT id, hash FROM file WHERE hash = ?", (file_hash,))
    existing = cursor.fetchone()
    
    if existing:
        file_id = existing[0]
        print(f"  ⏭️  File exists: {file_name}")
    else:
        # Insert file record
        cursor.execute("""
            INSERT INTO file (id, user_id, hash, filename, path, data, meta, created_at, updated_at)
            VALUES (?, 'adc1e3e5-f5df-467c-a64e-82c607b52cf0', ?, ?, ?, ?, ?, ?, ?)
        """, (
            file_id,
            file_hash,
            file_name,
            str(file_path),
            content,
            json.dumps(meta),
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        print(f"  ✅ Added file: {file_name}")
    
    # Link to knowledge base
    cursor.execute("""
        INSERT OR IGNORE INTO knowledge_file (knowledge_id, file_id)
        VALUES (?, ?)
    """, (knowledge_id, file_id))
    
    conn.commit()
    conn.close()
    return True

def sync_directory(db_path, source_dir, knowledge_id, file_patterns=None, exclude_patterns=None):
    """Sync all matching files from a directory to a knowledge base"""
    if file_patterns is None:
        file_patterns = ['**/*.md', '**/*.mdx', '**/*.txt']
    if exclude_patterns is None:
        exclude_patterns = ['.git', 'node_modules', '__pycache__', '.obsidian']
    
    source_path = Path(source_dir)
    if not source_path.exists():
        print(f"  ⚠️  Source path does not exist: {source_path}")
        return 0
    
    files = []
    for pattern in file_patterns:
        files.extend(source_path.glob(pattern))
    
    # Filter out excluded patterns
    filtered = []
    for file in files:
        if file.is_file() and not any(excl in str(file) for excl in exclude_patterns):
            filtered.append(file)
    
    files = sorted(set(filtered))
    print(f"  Found {len(files)} files to sync")
    
    added = 0
    for file_path in files:
        if add_file_to_db(db_path, file_path, knowledge_id):
            added += 1
    
    return added

def main():
    db_path = "/tmp/webui.db"
    
    # Knowledge base mappings
    configs = [
        {
            "name": "Thalamus-Company",
            "knowledge_id": "e0a5d7de-14d8-487c-a00e-527d3e69cd7a",
            "source_dir": "/Users/sesloan/Documents/companies/Thalamus/docs/master",
            "patterns": ['**/*.md', '**/*.mdx', '**/*.txt']
        },
        {
            "name": "CortexDigital-Company",
            "knowledge_id": "0521d976-1ec3-40f3-96cd-79cdca51c1f7",
            "source_dir": "/Users/sesloan/Documents/companies/Cortex Digital/docs/master",
            "patterns": ['**/*.md', '**/*.mdx', '**/*.txt']
        },
        {
            "name": "HypeLocal-Company",
            "knowledge_id": "c819d9f2-644a-4df5-9a11-c145d3833b5c",
            "source_dir": "/Users/sesloan/Documents/companies/Hype Local/docs/master",
            "patterns": ['**/*.md', '**/*.mdx', '**/*.txt']
        },
        {
            "name": "SYNAPTICA - Development",
            "knowledge_id": "b9ef4ca5-a96d-4736-a458-90ea63879881",
            "source_dir": "/Users/sesloan/repos/thalamus-ai/SYNAPTICA/docs/master-development",
            "patterns": ['**/*.md', '**/*.mdx']
        },
        {
            "name": "ExecutionIQ - Production",
            "knowledge_id": "e3abfa57-effe-4b7c-9b72-0ed137fc0362",
            "source_dir": "/Users/sesloan/repos/thalamus-ai/ExecutionIQ/docs/master-production",
            "patterns": ['**/*.md', '**/*.mdx']
        },
        {
            "name": "ExecutionIQ - Development",
            "knowledge_id": "09d6ecf5-b53f-42c5-9629-0196af54821c",
            "source_dir": "/Users/sesloan/repos/thalamus-ai/ExecutionIQ/docs/master-development",
            "patterns": ['**/*.md', '**/*.mdx']
        }
    ]
    
    total_added = 0
    for config in configs:
        print(f"\n📚 Syncing: {config['name']}")
        print(f"   Source: {config['source_dir']}")
        added = sync_directory(
            db_path,
            config['source_dir'],
            config['knowledge_id'],
            config['patterns']
        )
        total_added += added
        print(f"   ✅ Synced {added} files")
    
    print(f"\n🎉 Total files synced: {total_added}")

if __name__ == "__main__":
    main()
