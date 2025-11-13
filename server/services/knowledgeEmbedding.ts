import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TextChunk {
  text: string;
  index: number;
  tokens?: number;
}

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

/**
 * Split text into overlapping chunks of approximately the specified size (in tokens).
 * 
 * @param text - The text to split
 * @param chunkSize - Target chunk size in tokens (default: 500)
 * @param overlap - Overlap size in tokens (default: 50)
 * @returns Array of text chunks with indices
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): TextChunk[] {
  // Simple approximation: ~4 characters = 1 token
  const charsPerToken = 4;
  const chunkSizeChars = chunkSize * charsPerToken;
  const overlapChars = overlap * charsPerToken;
  
  const chunks: TextChunk[] = [];
  let startIdx = 0;
  let chunkIndex = 0;
  
  while (startIdx < text.length) {
    const endIdx = Math.min(startIdx + chunkSizeChars, text.length);
    const chunkText = text.slice(startIdx, endIdx);
    
    if (chunkText.trim().length > 0) {
      chunks.push({
        text: chunkText,
        index: chunkIndex,
        tokens: Math.ceil(chunkText.length / charsPerToken),
      });
      chunkIndex++;
    }
    
    // Move to next chunk with overlap
    if (endIdx >= text.length) break;
    startIdx = endIdx - overlapChars;
  }
  
  return chunks;
}

/**
 * Generate embeddings for an array of text chunks using OpenAI's embedding model.
 * 
 * @param chunks - Array of text chunks to embed
 * @param model - OpenAI embedding model (default: text-embedding-3-small)
 * @returns Array of chunks with embeddings
 */
export async function embedChunks(
  chunks: TextChunk[],
  model: string = "text-embedding-3-small"
): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) {
    return [];
  }
  
  // Batch embedding requests (OpenAI supports up to 2048 inputs per request)
  const batchSize = 100; // Conservative batch size
  const embeddedChunks: EmbeddedChunk[] = [];
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map(chunk => chunk.text);
    
    try {
      const response = await openai.embeddings.create({
        model,
        input: texts,
      });
      
      // Combine chunks with their embeddings
      batch.forEach((chunk, idx) => {
        embeddedChunks.push({
          ...chunk,
          embedding: response.data[idx].embedding,
        });
      });
    } catch (error) {
      console.error(`[KnowledgeEmbedding] Failed to embed batch ${i}-${i + batchSize}:`, error);
      throw error;
    }
  }
  
  return embeddedChunks;
}

/**
 * Compute cosine similarity between two embedding vectors.
 * 
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Embed a single query text for similarity search.
 * 
 * @param query - The query text to embed
 * @param model - OpenAI embedding model (default: text-embedding-3-small)
 * @returns Embedding vector
 */
export async function embedQuery(query: string, model: string = "text-embedding-3-small"): Promise<number[]> {
  const response = await openai.embeddings.create({
    model,
    input: [query],
  });
  
  return response.data[0].embedding;
}
