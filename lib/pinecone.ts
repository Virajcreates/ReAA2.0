import { Pinecone } from '@pinecone-database/pinecone';
import { ReraNamespace } from '@/types/rera';

let pineconeClient: Pinecone | null = null;
let lastApiKey: string | null = null;

export function getPineconeClient(): Pinecone | null {
  const pineconeApiKey = process.env.PINECONE_API_KEY || '';
  if (!pineconeApiKey) {
    return null;
  }
  if (!pineconeClient || lastApiKey !== pineconeApiKey) {
    try {
      pineconeClient = new Pinecone({
        apiKey: pineconeApiKey,
      });
      lastApiKey = pineconeApiKey;
    } catch (err) {
      console.error('Failed to initialize Pinecone client:', err);
      return null;
    }
  }
  return pineconeClient;
}

export function getPineconeIndex() {
  const pineconeIndexName = process.env.PINECONE_INDEX || process.env.PINECONE_INDEX_NAME || 'newreaa';
  const pineconeHost = process.env.PINECONE_HOST || '';
  const client = getPineconeClient();
  if (!client) return null;
  try {
    if (pineconeHost) {
      return client.index(pineconeIndexName, pineconeHost);
    }
    return client.index(pineconeIndexName);
  } catch (err) {
    console.error(`Failed to get Pinecone index '${pineconeIndexName}':`, err);
    return null;
  }
}

export interface PineconeQueryResultItem {
  id: string;
  score?: number;
  metadata?: Record<string, any>;
}

export async function queryPineconeNamespace(
  namespace: ReraNamespace,
  vector: number[],
  topK: number = 4,
  filter?: Record<string, any>
): Promise<PineconeQueryResultItem[]> {
  const index = getPineconeIndex();
  if (!index) {
    return [];
  }

  try {
    const namespaceIndex = index.namespace(namespace);
    const queryParams: any = {
      vector,
      topK,
      includeMetadata: true,
    };

    if (filter && Object.keys(filter).length > 0) {
      queryParams.filter = filter;
    }

    const queryResponse = await namespaceIndex.query(queryParams);

    return (queryResponse.matches || []).map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata || {},
    }));
  } catch (error) {
    console.warn(`Error querying Pinecone namespace '${namespace}' with filter:`, error);
    return [];
  }
}
