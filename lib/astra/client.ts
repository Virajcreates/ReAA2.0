import { DataAPIClient, Db, Collection } from '@datastax/astra-db-ts';

let astraClient: DataAPIClient | null = null;
let astraDbInstance: Db | null = null;
let astraLinksCollectionInstance: Collection | null = null;

export function getAstraDb(): Db | null {
  if (astraDbInstance) return astraDbInstance;

  const token = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const endpoint = process.env.ASTRA_DB_API_ENDPOINT;

  if (!token || !endpoint) {
    console.warn('Astra DB credentials missing from environment variables.');
    return null;
  }

  try {
    astraClient = new DataAPIClient(token.trim().replace(/^["']|["']$/g, ''));
    astraDbInstance = astraClient.db(endpoint.trim().replace(/^["']|["']$/g, ''));
    return astraDbInstance;
  } catch (err) {
    console.error('Failed to initialize Astra DB client:', err);
    return null;
  }
}

export function getAstraLinksCollection(): Collection | null {
  if (astraLinksCollectionInstance) return astraLinksCollectionInstance;

  const db = getAstraDb();
  if (!db) return null;

  const rawColl = process.env.ASTRA_DB_COLLECTION || 'rera_links';
  const collectionName = rawColl.trim().replace(/^["']|["']$/g, '');

  try {
    astraLinksCollectionInstance = db.collection(collectionName);
    return astraLinksCollectionInstance;
  } catch (err) {
    console.error(`Failed to get Astra collection '${collectionName}':`, err);
    return null;
  }
}
