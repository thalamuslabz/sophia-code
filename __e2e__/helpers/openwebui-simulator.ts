/**
 * Open WebUI Simulator for E2E Tests
 * 
 * Simulates the Open WebUI function behavior without requiring
 * the actual Open WebUI service to be running.
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BrainstormInput {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface IntentCreationResult {
  specId: string;
  intentId: string;
  project: string;
  timestamp: string;
}

/**
 * Simulates the Open WebUI intent creation flow
 */
export async function simulateOpenWebUIIntentCreation(
  input: BrainstormInput,
  options: { specDir?: string } = {}
): Promise<IntentCreationResult> {
  const specDir = options.specDir || process.env.AUTO_CLAUDE_SPEC_DIR || 
    path.join(process.env.HOME || '/tmp', '.auto-claude', 'specs');
  
  // Extract intent info from messages
  const lastMessage = input.messages[input.messages.length - 1];
  const { project, name, description } = extractIntentInfo(input.messages);
  
  // Generate IDs
  const timestamp = new Date();
  const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
  const uniqueId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const specId = `spec-${dateStr}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uniqueId}`;
  const intentId = `int-${dateStr}-${uniqueId}`;
  
  // Extract acceptance criteria from description bullet points
  const acceptanceCriteria = extractAcceptanceCriteria(description);
  
  // Extract tech stack
  const techStack = extractTechStack(description);
  
  // Extract architecture decisions from conversation
  const architectureDecisions = extractArchitectureDecisions(input.messages);
  
  // Create spec
  const spec = {
    id: specId,
    intentId,
    project,
    name,
    description,
    acceptance_criteria: acceptanceCriteria,
    architecture_decisions: architectureDecisions,
    tech_stack: techStack,
    features: acceptanceCriteria,
    context: formatConversationContext(input.messages),
    timestamp: timestamp.toISOString(),
    source: 'openwebui-e2e-test'
  };
  
  // Write spec file
  await fs.mkdir(specDir, { recursive: true });
  await fs.writeFile(
    path.join(specDir, `${specId}.json`),
    JSON.stringify(spec, null, 2),
    'utf-8'
  );
  
  // Trigger n8n webhook (if available)
  try {
    await triggerN8NIntentWebhook(spec);
  } catch (error) {
    console.warn('n8n webhook failed (expected in test env):', error);
  }
  
  return {
    specId,
    intentId,
    project,
    timestamp: spec.timestamp
  };
}

function extractIntentInfo(messages: BrainstormInput['messages']): {
  project: string;
  name: string;
  description: string;
} {
  const lastMessage = messages[messages.length - 1].content;
  
  // Try to extract "PROJECT/name" pattern
  const lockMatch = lastMessage.match(/\/(?:lock|create intent|intent)\s+(?:this\s+in\s+as\s+)?([A-Z]+)\/([\w-]+)/i);
  
  if (lockMatch) {
    return {
      project: lockMatch[1].toUpperCase(),
      name: lockMatch[2],
      description: messages.map(m => m.content).join('\n\n')
    };
  }
  
  // Fallback: extract from conversation
  const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
  const projectMatch = firstUserMessage.match(/\b(ASO|SYNAPTICA|SOPHIA|ExecutionIQ)\b/i);
  
  return {
    project: projectMatch ? projectMatch[1].toUpperCase() : 'TEST',
    name: 'unnamed-intent',
    description: messages.map(m => m.content).join('\n\n')
  };
}

function extractAcceptanceCriteria(description: string): string[] {
  const criteria: string[] = [];
  const lines = description.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^[\s]*[-•*]\s+(.+)$/);
    if (match) {
      criteria.push(match[1].trim());
    }
  }
  
  // If no bullet points, extract sentences with requirements
  if (criteria.length === 0) {
    const sentences = description.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.match(/\b(should|must|need|require)\b/i)) {
        criteria.push(sentence.trim());
      }
    }
  }
  
  return criteria.length > 0 ? criteria : ['Implement as described'];
}

function extractTechStack(text: string): string[] {
  const techPatterns: Record<string, RegExp> = {
    react: /\breact\b/i,
    typescript: /\btypescript\b|\bts\b/i,
    nodejs: /\bnode\.?js\b/i,
    python: /\bpython\b/i,
    auth0: /\bauth0\b/i,
    redis: /\bredis\b/i,
    jwt: /\bjwt\b/i,
    oauth: /\boauth\b/i,
    tailwind: /\btailwind\b/i,
    docker: /\bdocker\b/i,
  };
  
  return Object.entries(techPatterns)
    .filter(([_, pattern]) => pattern.test(text))
    .map(([tech]) => tech);
}

function extractArchitectureDecisions(
  messages: BrainstormInput['messages']
): Array<{ decision: string; rationale: string }> {
  const decisions: Array<{ decision: string; rationale: string }> = [];
  
  for (const message of messages) {
    const text = message.content;
    
    // Match patterns like "Use X because Y" or "Decided on X for Y"
    const decisionMatches = text.matchAll(
      /(?:use|choose|decide(?:d| on)|going with)\s+([\w\s]+?)(?:\s+(?:because|for|to)\s+([\w\s]+?))?(?:[.\n]|$)/gi
    );
    
    for (const match of decisionMatches) {
      decisions.push({
        decision: match[1].trim(),
        rationale: match[2]?.trim() || 'Mentioned in conversation'
      });
    }
  }
  
  return decisions.length > 0 ? decisions : [
    { decision: 'Architecture', rationale: 'To be determined during implementation' }
  ];
}

function formatConversationContext(
  messages: BrainstormInput['messages']
): string {
  return messages.map(m => 
    `${m.role.toUpperCase()}: ${m.content}`
  ).join('\n\n');
}

async function triggerN8NIntentWebhook(spec: any): Promise<void> {
  const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:3118/webhook/sophia-intent-created';
  
  try {
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: spec })
    });
    
    if (!response.ok) {
      throw new Error(`n8n returned ${response.status}`);
    }
  } catch (error) {
    // In E2E tests, n8n might not be running - that's OK
    console.log('Note: n8n webhook not available (expected in test mode)');
  }
}
