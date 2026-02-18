#!/usr/bin/env node
/**
 * Leantime Integration CLI
 */

import { Command } from 'commander';
import { LeantimeClient } from './core/leantime-client.js';

const program = new Command();

program
  .name('leantime-sync')
  .description('Sync Thalamus AI with Leantime project management')
  .version('1.0.0');

program
  .command('projects')
  .description('List available projects')
  .option('-u, --url <url>', 'Leantime URL', process.env.LEANTIME_URL)
  .option('-k, --key <key>', 'API Key', process.env.LEANTIME_API_KEY)
  .action(async (options) => {
    const client = new LeantimeClient({
      baseUrl: options.url,
      apiKey: options.key
    });
    
    const projects = await client.getProjects();
    console.log('Available Projects:');
    projects.forEach(p => {
      console.log(`  ${p.id}: ${p.name}`);
    });
  });

program
  .command('create')
  .description('Create ticket from intent')
  .argument('<intent-file>', 'Intent JSON file')
  .option('-u, --url <url>', 'Leantime URL', process.env.LEANTIME_URL)
  .option('-k, --key <key>', 'API Key', process.env.LEANTIME_API_KEY)
  .action(async (intentFile, options) => {
    // Implementation
    console.log(`Creating ticket from: ${intentFile}`);
  });

program.parse();
