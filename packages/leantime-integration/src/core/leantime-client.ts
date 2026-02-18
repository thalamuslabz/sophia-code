/**
 * Leantime API Client
 * 
 * Integrates with Leantime project management for:
 * - Creating tickets from intents
 * - Updating ticket status from build progress
 * - Linking evidence to tickets
 */

export interface LeantimeConfig {
  baseUrl: string;
  apiKey: string;
}

export interface Ticket {
  id?: number;
  headline: string;
  description: string;
  projectId: number;
  type?: 'task' | 'story' | 'bug' | 'epic';
  status?: number;
  priority?: number;
  tags?: string[];
}

export interface Project {
  id: number;
  name: string;
  clientId: number;
}

export class LeantimeClient {
  private config: LeantimeConfig;

  constructor(config: LeantimeConfig) {
    this.config = config;
  }

  /**
   * Create a new ticket from an intent
   */
  async createTicket(ticket: Ticket): Promise<{ id: number; message: string }> {
    const response = await fetch(`${this.config.baseUrl}/api/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'leantime.rpc.Tickets.addTicket',
        params: {
          values: {
            headline: ticket.headline,
            description: ticket.description,
            projectId: ticket.projectId,
            type: ticket.type || 'task',
            priority: ticket.priority || 3,
            tags: ticket.tags?.join(',') || ''
          }
        },
        id: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Leantime API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Leantime error: ${data.error.message}`);
    }

    return {
      id: data.result,
      message: 'Ticket created successfully'
    };
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: number, statusId: number): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'leantime.rpc.Tickets.updateTicket',
        params: {
          id: ticketId,
          values: {
            status: statusId
          }
        },
        id: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Leantime API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Leantime error: ${data.error.message}`);
    }
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketId: number, comment: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'leantime.rpc.Comments.addComment',
        params: {
          entity: 'ticket',
          module: 'tickets',
          id: ticketId,
          comment: comment
        },
        id: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Leantime API error: ${response.statusText}`);
    }
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${this.config.baseUrl}/api/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'leantime.rpc.Projects.getAll',
        params: {},
        id: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Leantime API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Leantime error: ${data.error.message}`);
    }

    return data.result || [];
  }

  /**
   * Get project by name
   */
  async getProjectByName(name: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find(p => 
      p.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  /**
   * Create ticket from intent
   */
  async createTicketFromIntent(
    intent: {
      intent_id: string;
      project: string;
      name: string;
      description: string;
      acceptance_criteria?: string[];
      tech_stack?: string[];
    },
    projectMapping: Record<string, number> = {}
  ): Promise<{ id: number; url: string }> {
    // Find project or use default
    const projectId = projectMapping[intent.project.toLowerCase()];
    
    if (!projectId) {
      // Try to find project by name
      const project = await this.getProjectByName(intent.project);
      if (!project) {
        throw new Error(`Project not found: ${intent.project}`);
      }
    }

    // Build description
    let description = `## Intent ID\n${intent.intent_id}\n\n`;
    description += `## Description\n${intent.description}\n\n`;
    
    if (intent.acceptance_criteria?.length) {
      description += `## Acceptance Criteria\n`;
      intent.acceptance_criteria.forEach(c => {
        description += `- [ ] ${c}\n`;
      });
      description += '\n';
    }

    if (intent.tech_stack?.length) {
      description += `## Tech Stack\n`;
      intent.tech_stack.forEach(t => {
        description += `- ${t}\n`;
      });
    }

    const result = await this.createTicket({
      headline: `${intent.project}: ${intent.name}`,
      description,
      projectId: projectId || 1,
      type: 'story',
      tags: ['ai-generated', 'thalamus', intent.project.toLowerCase()]
    });

    return {
      id: result.id,
      url: `${this.config.baseUrl}/tickets/showTicket/${result.id}`
    };
  }

  /**
   * Update ticket with build evidence
   */
  async addBuildEvidence(
    ticketId: number,
    evidence: {
      intent_id: string;
      status: string;
      artifacts: number;
      test_results?: { passed: number; failed: number };
      obsidian_note?: string;
    }
  ): Promise<void> {
    const statusEmoji = evidence.status === 'success' ? '✅' : 
                       evidence.status === 'failure' ? '❌' : '⚠️';

    let comment = `## Build Complete ${statusEmoji}\n\n`;
    comment += `**Intent:** ${evidence.intent_id}\n`;
    comment += `**Status:** ${evidence.status}\n`;
    comment += `**Artifacts:** ${evidence.artifacts} files\n`;

    if (evidence.test_results) {
      comment += `\n### Test Results\n`;
      comment += `- Passed: ${evidence.test_results.passed} ✅\n`;
      comment += `- Failed: ${evidence.test_results.failed} ❌\n`;
    }

    if (evidence.obsidian_note) {
      comment += `\n### Documentation\n`;
      comment += `[View in Obsidian](${evidence.obsidian_note})\n`;
    }

    await this.addComment(ticketId, comment);

    // Update ticket status based on build result
    if (evidence.status === 'success') {
      await this.updateTicketStatus(ticketId, 1); // Done
    } else if (evidence.status === 'failure') {
      await this.updateTicketStatus(ticketId, 4); // In Progress (needs fix)
    }
  }
}
