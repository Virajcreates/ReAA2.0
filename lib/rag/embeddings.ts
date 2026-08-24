import { getGeminiClient, GEMINI_EMBEDDING_MODEL } from '@/lib/gemini';

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n+/g, ' ').trim();
  const client = getGeminiClient();

  if (!client) {
    // Generate deterministic normalized 3072-dim mock embedding for local testing
    return generateMockEmbedding(cleanText, 3072);
  }

  try {
    const model = client.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001' });
    const result = await model.embedContent(cleanText);
    const embedding = result.embedding;
    return embedding.values;
  } catch (error) {
    console.warn('Failed to generate Google embedding, falling back to local 3072-dim vector representation:', error);
    return generateMockEmbedding(cleanText, 3072);
  }
}

// Fallback deterministic 3072-dim vector generator matching Pinecone newreaa index
function generateMockEmbedding(text: string, dimension = 3072): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  const vector = new Array(dimension);
  let sumSq = 0;
  for (let i = 0; i < dimension; i++) {
    const val = Math.sin(hash + i * 0.137) * Math.cos(i * 0.491);
    vector[i] = val;
    sumSq += val * val;
  }

  // Normalize to unit length
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map((v) => v / norm);
}
