#!/usr/bin/env node
/**
 * Obsidian Sync CLI
 * 
 * Commands:
 *   obsidian-sync start          - Start watching for evidence
 *   obsidian-sync stop           - Stop watcher
 *   obsidian-sync status         - Show sync status
 *   obsidian-sync sync <file>    - Manually sync an evidence file
 *   obsidian-sync init           - Initialize vault structure
 */

import { Command } from 'commander';
import { EvidenceSync } from './core/evidence-sync.js';
import { VaultInitializer } from './core/vault-init.js';

const program = new Command();

program
  .name('obsidian-sync')
  .description('Sync Thalamus AI evidence to Obsidian vault')
  .version('1.0.0');

program
  .command('start')
  .description('Start watching evidence directory')
  .option('-v, --vault <path>', 'Obsidian vault path')
  .option('-e, --evidence <path>', 'Evidence directory')
  .action(async (options) => {
    const sync = new EvidenceSync({
      vaultDir: options.vault,
      evidenceDir: options.evidence
    });

    console.log('Starting Obsidian Sync...');
    await sync.start();

    process.on('SIGINT', async () => {
      console.log('\nStopping...');
      await sync.stop();
      process.exit(0);
    });
  });

program
  .command('stop')
  .description('Stop the sync daemon')
  .action(() => {
    console.log('To stop, press Ctrl+C in the running terminal');
  });

program
  .command('status')
  .description('Show sync status')
  .option('-v, --vault <path>', 'Obsidian vault path')
  .option('-e, --evidence <path>', 'Evidence directory')
  .action(async (options) => {
    const sync = new EvidenceSync({
      vaultDir: options.vault,
      evidenceDir: options.evidence
    });

    const stats = await sync.getStats();
    console.log('Obsidian Sync Status');
    console.log('====================');
    console.log(`Synced:  ${stats.synced}`);
    console.log(`Pending: ${stats.pending}`);
  });

program
  .command('sync')
  .description('Manually sync an evidence file')
  .argument('<file>', 'Evidence JSON file to sync')
  .option('-v, --vault <path>', 'Obsidian vault path')
  .action(async (file, options) => {
    const sync = new EvidenceSync({ vaultDir: options.vault });
    // Manual sync logic would go here
    console.log(`Syncing: ${file}`);
  });

program
  .command('init')
  .description('Initialize Obsidian vault structure')
  .option('-v, --vault <path>', 'Obsidian vault path')
  .action(async (options) => {
    const initializer = new VaultInitializer(options.vault);
    await initializer.init();
    console.log('Vault structure initialized');
  });

program.parse();
