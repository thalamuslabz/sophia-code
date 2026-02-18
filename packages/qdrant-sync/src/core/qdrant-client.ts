/**
 * Qdrant Vector Database Client
 * 
 * Provides semantic search capabilities across:
 * - Obsidian vault documentation
 * - Code repositories
 * - Build evidence
 * - Intent history
 */

import { QdrantClient } from '@qdrant/js-client-rest';

export interface QdrantConfig {
  url: string;
  apiKey?: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    project?: string;
    type: string;
    tags?: string[];
    modified: string;
    chunkIndex: number;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: DocumentChunk['metadata'];
}

export class QdrantSync {
  private client: QdrantClient;
  private collections: Map<string, string> = new Map([
    ['obsidian-vault', 'Obsidian Vault'],
    ['code-repos', 'Code Repositories'],
    ['build-evidence', 'Build Evidence'],
    ['intents', 'Intent History']
  ]);

  constructor(config: QdrantConfig) {
    this.client = new QdrantClient({
      url: config.url,
      apiKey: config.apiKey
    });
  }

  /**
   * Initialize collections if they don't exist
   */
  async initializeCollections(vectorSize: number = 384): Promise<void> {
    for (const [collectionName, description] of this.collections) {
      try {
        await this.client.getCollection(collectionName);
        console.log(`Collection exists: ${collectionName}`);
      } catch {
        // Collection doesn't exist, create it
        await this.client.createCollection(collectionName, {
          vectors: {
            size: vectorSize,
            distance: 'Cosine'
          },
          optimizers_config: {
            default_segment_number: 2
          }
        });

        // Create payload indexes for filtering
        await this.client.createPayloadIndex(collectionName, {
          field_name: 'project',
          field_schema: 'keyword'
        });

        await this.client.createPayloadIndex(collectionName, {
          field_name: 'type',
          field_schema: 'keyword'
        });

        await this.client.createPayloadIndex(collectionName, {
          field_name: 'tags',
          field_schema: 'keyword'
        });

        console.log(`Created collection: ${collectionName} (${description})`);
      }
    }
  }

  /**
   * Add document chunks with embeddings
   */
  async addChunks(
    collectionName: string,
    chunks: Array<{
      id: string;
      vector: number[];
      content: string;
      metadata: DocumentChunk['metadata'];
    }>
  ): Promise<void> {
    const points = chunks.map(chunk => ({
      id: chunk.id,
      vector: chunk.vector,
      payload: {
        content: chunk.content,
        ...chunk.metadata
      }
    }));

    await this.client.upsert(collectionName, {
      points
    });
  }

  /**
   * Search for similar content
   */
  async search(
    collectionName: string,
    vector: number[],
    options: {
      limit?: number;
      filter?: Record<string, unknown>;
      scoreThreshold?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const results = await this.client.search(collectionName, {
      vector,
      limit: options.limit || 10,
      filter: options.filter,
      score_threshold: options.scoreThreshold || 0.7,
      with_payload: true
    });

    return results.map(result => ({
      id: result.id as string,
      score: result.score,
      content: result.payload?.content as string,
      metadata: {
        source: result.payload?.source as string,
        project: result.payload?.project as string,
        type: result.payload?.type as string,
        tags: result.payload?.tags as string[],
        modified: result.payload?.modified as string,
        chunkIndex: result.payload?.chunkIndex as number
      }
    }));
  }

  /**
   * Search across all collections
   */
  async searchAll(
    vector: number[],
    options: {
      limit?: number;
      scoreThreshold?: number;
    } = {}
  ): Promise<Record<string, SearchResult[]>> {
    const results: Record<string, SearchResult[]> = {};

    for (const collectionName of this.collections.keys()) {
      try {
        const collectionResults = await this.search(collectionName, vector, options);
        if (collectionResults.length > 0) {
          results[collectionName] = collectionResults;
        }
      } catch (error) {
        console.warn(`Search failed for ${collectionName}:`, error);
      }
    }

    return results;
  }

  /**
   * Delete chunks by source file
   */
  async deleteBySource(collectionName: string, sourcePath: string): Promise<void> {
    await this.client.delete(collectionName, {
      filter: {
        must: [
          {
            key: 'source',
            match: { value: sourcePath }
          }
        ]
      }
    });
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(collectionName: string): Promise<{
    exists: boolean;
    pointsCount?: number;
    vectorsCount?: number;
  }> {
    try {
      const info = await this.client.getCollection(collectionName);
      return {
        exists: true,
        pointsCount: info.points_count,
        vectorsCount: info.vectors_count
      };
    } catch {
      return { exists: false };
    }
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<string[]> {
    const response = await this.client.getCollections();
    return response.collections.map(c => c.name);
  }

  /**
   * Generate embedding using local Ollama
   */
  async generateEmbedding(text: string, model: string = 'all-minilm'): Promise<number[]> {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  /**
   * Chunk text into smaller pieces
   */
  chunkText(
    text: string,
    options: {
      chunkSize?: number;
      overlap?: number;
    } = {}
  ): string[] {
    const chunkSize = options.chunkSize || 500;
    const overlap = options.overlap || 100;

    if (text.length <= chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let i = 0;

    while (i < text.length) {
      chunks.push(text.substring(i, i + chunkSize));
      i += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * Index a markdown file
   */
  async indexMarkdownFile(
    collectionName: string,
    filePath: string,
    content: string,
    metadata: {
      project?: string;
      type?: string;
      tags?: string[];
      modified: string;
    }
  ): Promise<void> {
    // Delete existing chunks for this file
    await this.deleteBySource(collectionName, filePath);

    // Parse frontmatter if present
    let bodyContent = content;
    let frontmatter: Record<string, unknown> = {};

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n(.*)$/);
    if (frontmatterMatch) {
      const frontmatterText = frontmatterMatch[1];
      bodyContent = frontmatterMatch[2];

      // Simple YAML parsing
      for (const line of frontmatterText.split('\n')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          frontmatter[key] = value;
        }
      }
    }

    // Chunk content
    const chunks = this.chunkText(bodyContent);

    // Generate embeddings and store
    const chunkData = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.generateEmbedding(chunk);

      chunkData.push({
        id: `${filePath}-${i}`,
        vector: embedding,
        content: chunk,
        metadata: {
          source: filePath,
          project: metadata.project || (frontmatter.project as string) || 'unknown',
          type: metadata.type || (frontmatter.type as string) || 'note',
          tags: metadata.tags || (frontmatter.tags as string[]) || [],
          modified: metadata.modified,
          chunkIndex: i
        }
      });
    }

    await this.addChunks(collectionName, chunkData);
  }
}
