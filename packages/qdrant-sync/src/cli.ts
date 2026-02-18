#!/usr/bin/env node
/**
 * Qdrant Sync CLI
 */

import { Command } from 'commander';
import { QdrantSync } from './core/qdrant-client.js';

const program = new Command();

program
  .name('qdrant-sync')
  .description('Sync documents to Qdrant vector database')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Qdrant collections')
  .option('-u, --url <url>', 'Qdrant URL', 'http://localhost:6333')
  .action(async (options) => {
    const qdrant = new QdrantSync({ url: options.url });
    await qdrant.initializeCollections();
    console.log('Collections initialized');
  });

program
  .command('sync-vault')
  .description('Sync Obsidian vault to Qdrant')
  .argument('<vault-path>', 'Path to Obsidian vault')
  .option('-u, --url <url>', 'Qdrant URL', 'http://localhost:6333')
  .action(async (vaultPath, options) => {
    console.log(`Syncing vault: ${vaultPath}`);
    // Implementation
  });

program
  .command('search')
  .description('Search Qdrant')
  .argument('<query>', 'Search query')
  .option('-c, --collection <name>', 'Collection name', 'obsidian-vault')
  .option('-l, --limit <n>', 'Result limit', '10')
  .option('-u, --url <url>', 'Qdrant URL', 'http://localhost:6333')
  .action(async (query, options) => {
    const qdrant = new QdrantSync({ url: options.url });
    const vector = await qdrant.generateEmbedding(query);
    const results = await qdrant.search(options.collection, vector, {
      limit: parseInt(options.limit)
    });
    
    console.log(`Found ${results.length} results:`);
    results.forEach(r => {
      console.log(`  ${r.score.toFixed(2)}: ${r.metadata.source}`);
    });
  });

program
  .command('stats')
  .description('Show collection stats')
  .option('-u, --url <url>', 'Qdrant URL', 'http://localhost:6333')
  .action(async (options) => {
    const qdrant = new QdrantSync({ url: options.url });
    const collections = await qdrant.listCollections();
    
    console.log('Collections:');
    for (const name of collections) {
      const info = await qdrant.getCollectionInfo(name);
      console.log(`  ${name}: ${info.pointsCount} points`);
    }
  });

program.parse();
