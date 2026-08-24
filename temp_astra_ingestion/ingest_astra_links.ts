import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DataAPIClient } from '@datastax/astra-db-ts';

// ==============================================================================
// 1. Environment Variable Loading
// ==============================================================================
function loadEnv() {
  const envPaths = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env.local'),
    path.resolve(__dirname, '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadEnv();

const ASTRA_DB_API_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT || '';
const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN || '';
const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION || 'rera_links';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

const CHUNK_SIZE = 30; // 30 documents per chunk (under 2048 token limit)
const ASTRA_INSERT_BATCH_SIZE = 25;
const RATE_LIMIT_DELAY_MS = 250; // Delay between Gemini embedding calls

// Aggressive cleaning filters
const INVALID_EXACT_NAMES = new Set(['document', 'yes', 'null', 'undefined', 'na', 'n/a', '-', '--']);
const INVALID_SUBSTRING_REGEX = /(na\.pdf|not\s*applicable|not\s*available)/i;

interface ProjectGroup {
  rera_number: string;
  project_name: string;
  documents: Array<{ name: string; link: string }>;
}

interface DocumentChunk {
  id: string;
  rera_number: string;
  project_name: string;
  chunk_index: number;
  total_chunks: number;
  text: string;
  documents: Array<{ name: string; link: string }>;
}

// ==============================================================================
// 2. CSV Line Parser (handles quotes & commas)
// ==============================================================================
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function resolveCSVPath(argPath?: string): string {
  if (argPath && fs.existsSync(argPath)) return path.resolve(argPath);

  const candidates = [
    path.resolve(process.cwd(), 'krera_project_documents_final.csv'),
    path.resolve(__dirname, 'krera_project_documents_final.csv'),
    path.resolve(__dirname, '../krera_project_documents_final.csv'),
    path.resolve(process.cwd(), '../krera_project_documents_final.csv'),
    path.resolve(process.cwd(), '../NewReaa/krera_project_documents_final.csv'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return path.resolve(process.cwd(), 'krera_project_documents_final.csv');
}

// ==============================================================================
// 3. Document Cleaning Logic
// ==============================================================================
function isValidDocument(name: string, link: string): boolean {
  if (!name || !link) return false;
  const cleanName = name.trim();
  const cleanLink = link.trim();

  if (cleanName.length < 2 || cleanLink.length < 5) return false;
  if (INVALID_EXACT_NAMES.has(cleanName.toLowerCase())) return false;
  if (INVALID_SUBSTRING_REGEX.test(cleanName)) return false;
  if (cleanName.toLowerCase().startsWith('document') && cleanName.length <= 10) return false;

  return true;
}

// ==============================================================================
// 4. Gemini Embedding with Exponential Backoff
// ==============================================================================
async function generateEmbeddingWithRetry(
  genAI: GoogleGenerativeAI,
  text: string,
  maxRetries = 5
): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await model.embedContent(text);
      if (res && res.embedding && res.embedding.values) {
        return res.embedding.values;
      }
      throw new Error('Empty embedding values returned');
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      console.warn(`[Retry ${attempt}/${maxRetries}] Gemini Embedding API backoff (${delay}ms)... Error: ${err.message || err}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error('Embedding generation failed after retries');
}

// ==============================================================================
// 5. Main Ingestion Pipeline
// ==============================================================================
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isFull = args.includes('--full');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const fileArg = args.find((a) => a.startsWith('--file='));

  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : (isDryRun ? 100 : (isFull ? Infinity : 50));
  const customFile = fileArg ? fileArg.split('=')[1] : undefined;
  const csvPath = resolveCSVPath(customFile);

  console.log('======================================================================');
  console.log('🚀 Astra DB "Smart Batching" Document Links Ingestion Pipeline');
  console.log('======================================================================');
  console.log(`Execution Mode:    ${isDryRun ? 'DRY-RUN (No API / DB Calls)' : isFull ? 'FULL DATASET' : `SAMPLE RUN (Limit: ${limit} projects)`}`);
  console.log(`Target CSV Path:   ${csvPath}`);
  console.log(`Astra Endpoint:    ${ASTRA_DB_API_ENDPOINT}`);
  console.log(`Astra Collection:  ${ASTRA_DB_COLLECTION}`);
  console.log(`Embedding Model:   ${EMBEDDING_MODEL} (3072 dims)`);
  console.log(`Batch Size:        ${CHUNK_SIZE} docs/chunk | ${ASTRA_INSERT_BATCH_SIZE} docs/insert`);
  console.log('======================================================================\n');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: CSV file not found at: ${csvPath}`);
    console.error(`Please specify the CSV path using: --file="C:\\path\\to\\krera_project_documents_final.csv"`);
    process.exit(1);
  }

  if (!isDryRun) {
    if (!GEMINI_API_KEY) {
      console.error('❌ Error: GEMINI_API_KEY is missing from environment variables.');
      process.exit(1);
    }
    if (!ASTRA_DB_API_ENDPOINT || !ASTRA_DB_APPLICATION_TOKEN) {
      console.error('❌ Error: ASTRA_DB_API_ENDPOINT or ASTRA_DB_APPLICATION_TOKEN is missing from environment variables.');
      process.exit(1);
    }
  }

  // ----------------------------------------------------------------------------
  // Step A: Stream & Clean CSV Data
  // ----------------------------------------------------------------------------
  console.log(`[Step 1/4] Streaming and cleaning records from CSV...`);

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const projectMap = new Map<string, ProjectGroup>();
  let totalRowsRead = 0;
  let totalRowsCleaned = 0;
  let headers: string[] = [];

  let reraIdx = -1;
  let projIdx = -1;
  let docNameIdx = -1;
  let docLinkIdx = -1;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (totalRowsRead === 0) {
      headers = parseCSVLine(trimmed).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''));
      reraIdx = headers.findIndex((h) => h.includes('rera') || h.includes('reg') || h.includes('ack'));
      projIdx = headers.findIndex((h) => h.includes('project') || h.includes('name'));
      docNameIdx = headers.findIndex((h) => h.includes('doc') && (h.includes('name') || h.includes('title') || h.includes('type')));
      docLinkIdx = headers.findIndex((h) => h.includes('link') || h.includes('url') || h.includes('path') || h.includes('certificate'));

      // Fallback column indexing
      if (reraIdx === -1) reraIdx = 0;
      if (projIdx === -1) projIdx = 1;
      if (docNameIdx === -1) docNameIdx = 2;
      if (docLinkIdx === -1) docLinkIdx = 3;

      totalRowsRead++;
      continue;
    }

    totalRowsRead++;
    const cols = parseCSVLine(trimmed);
    const reraNumber = (cols[reraIdx] || '').trim();
    const projectName = (cols[projIdx] || '').trim();
    const docName = (cols[docNameIdx] || '').trim();
    const docLink = (cols[docLinkIdx] || '').trim();

    if (!reraNumber || !isValidDocument(docName, docLink)) {
      continue;
    }

    totalRowsCleaned++;

    if (!projectMap.has(reraNumber)) {
      projectMap.set(reraNumber, {
        rera_number: reraNumber,
        project_name: projectName || 'Unknown Project',
        documents: [],
      });
    }

    const group = projectMap.get(reraNumber)!;
    if (!projectName && group.project_name === 'Unknown Project' && projectName) {
      group.project_name = projectName;
    }
    group.documents.push({ name: docName, link: docLink });
  }

  console.log(` -> Processed ${totalRowsRead.toLocaleString()} raw lines.`);
  console.log(` -> Retained ${totalRowsCleaned.toLocaleString()} valid document links across ${projectMap.size.toLocaleString()} unique projects.`);

  // ----------------------------------------------------------------------------
  // Step B: Smart Chunking (30 docs per chunk)
  // ----------------------------------------------------------------------------
  console.log(`\n[Step 2/4] Chunking project documents (Max ${CHUNK_SIZE} docs/chunk)...`);

  const allChunks: DocumentChunk[] = [];
  let projectCounter = 0;
  const projectEntries = Array.from(projectMap.entries());

  for (const [reraNumber, group] of projectEntries) {
    projectCounter++;
    if (projectCounter > limit) break;

    const docs = group.documents;
    const cleanRera = reraNumber.replace(/[^A-Za-z0-9]/g, '_');
    const totalChunks = Math.ceil(docs.length / CHUNK_SIZE) || 1;

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      const chunkDocs = docs.slice(chunkIdx * CHUNK_SIZE, (chunkIdx + 1) * CHUNK_SIZE);
      const docListText = chunkDocs
        .map((d: { name: string; link: string }, i: number) => `${i + 1}. ${d.name} - ${d.link}`)
        .join('\n');

      const textPayload = `Statutory documents for project ${group.project_name} (Registration: ${reraNumber}) [Part ${chunkIdx + 1}/${totalChunks}]:\n${docListText}`;

      allChunks.push({
        id: `DOC_${cleanRera}_chunk_${chunkIdx + 1}`,
        rera_number: reraNumber,
        project_name: group.project_name,
        chunk_index: chunkIdx + 1,
        total_chunks: totalChunks,
        text: textPayload,
        documents: chunkDocs,
      });
    }
  }

  console.log(` -> Generated ${allChunks.length.toLocaleString()} chunks from ${Math.min(projectCounter - 1, limit)} projects.`);

  // ----------------------------------------------------------------------------
  // Step C: Dry-Run Inspection
  // ----------------------------------------------------------------------------
  if (isDryRun) {
    console.log('\n======================================================================');
    console.log('🔍 DRY-RUN PREVIEW: Sample Astra DB Payloads (First 3 Chunks)');
    console.log('======================================================================');
    allChunks.slice(0, 3).forEach((chunk, i) => {
      console.log(`\n[Chunk #${i + 1}] _id: ${chunk.id}`);
      console.log(`Astra Document: {`);
      console.log(`  "_id": "${chunk.id}",`);
      console.log(`  "project_name": "${chunk.project_name}",`);
      console.log(`  "registration_number": "${chunk.rera_number}",`);
      console.log(`  "chunk_index": ${chunk.chunk_index},`);
      console.log(`  "total_chunks": ${chunk.total_chunks},`);
      console.log(`  "document_count": ${chunk.documents.length},`);
      console.log(`  "$vector": [ <3072-dimensional embedding array> ]`);
      console.log(`}`);
      console.log(`--- Payload Text ---`);
      console.log(chunk.text);
      console.log(`--------------------\n`);
    });

    console.log('✅ Dry-Run completed successfully. Zero mutations made to Astra DB.');
    console.log('To ingest data, run with `--limit=50` or `--full`.');
    return;
  }

  // ----------------------------------------------------------------------------
  // Step D: Embedding Generation & Astra DB Insertion
  // ----------------------------------------------------------------------------
  console.log(`\n[Step 3/4] Initializing Astra DB and Gemini clients...`);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const astraClient = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
  const db = astraClient.db(ASTRA_DB_API_ENDPOINT);

  // Initialize / verify collection with 3072 dimensions
  let collection: any;
  try {
    console.log(` -> Checking / Creating Astra collection '${ASTRA_DB_COLLECTION}' (dimension: 3072, metric: cosine)...`);
    collection = await db.createCollection(ASTRA_DB_COLLECTION, {
      vector: {
        dimension: 3072,
        metric: 'cosine',
      },
    });
  } catch (err) {
    collection = db.collection(ASTRA_DB_COLLECTION);
  }

  console.log(`[Step 4/4] Generating 3072-dim embeddings & inserting into Astra collection [${ASTRA_DB_COLLECTION}]...`);

  let insertBuffer: Array<{
    _id: string;
    $vector: number[];
    project_name: string;
    registration_number: string;
    chunk_index: number;
    total_chunks: number;
    document_count: number;
    text: string;
  }> = [];

  let totalInserted = 0;
  const startTime = Date.now();

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];

    try {
      const vector = await generateEmbeddingWithRetry(genAI, chunk.text);

      insertBuffer.push({
        _id: chunk.id,
        $vector: vector,
        project_name: chunk.project_name,
        registration_number: chunk.rera_number,
        chunk_index: chunk.chunk_index,
        total_chunks: chunk.total_chunks,
        document_count: chunk.documents.length,
        text: chunk.text,
      });

      // Throttle Gemini API calls
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));

      // Batch Insert into Astra DB
      if (insertBuffer.length >= ASTRA_INSERT_BATCH_SIZE || i === allChunks.length - 1) {
        try {
          await collection.insertMany(insertBuffer, { ordered: false });
          totalInserted += insertBuffer.length;
        } catch (insertErr: any) {
          // If some documents already exist, handle gracefully
          if (insertErr.partialResult) {
            totalInserted += insertErr.partialResult.insertedIds?.length || insertBuffer.length;
          } else {
            // Fallback to sequential insert if batch fails
            for (const doc of insertBuffer) {
              try {
                await collection.insertOne(doc);
                totalInserted++;
              } catch (singleErr: any) {
                // Ignore duplicate key errors if already present
                if (!singleErr.message?.includes('duplicate') && !singleErr.message?.includes('already exists')) {
                  console.warn(`Single insert warning for ${doc._id}:`, singleErr.message || singleErr);
                }
              }
            }
          }
        }

        const pct = (((i + 1) / allChunks.length) * 100).toFixed(1);
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(` -> Inserted [${totalInserted}/${allChunks.length}] chunks (${pct}%) - Elapsed: ${elapsedSec}s`);
        insertBuffer = [];
      }
    } catch (err: any) {
      console.error(`❌ Failed processing chunk ${chunk.id}:`, err.message || err);
    }
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n======================================================================');
  console.log('🎉 ASTRA DB INGESTION PIPELINE COMPLETE');
  console.log('======================================================================');
  console.log(`Total Documents Inserted: ${totalInserted.toLocaleString()}`);
  console.log(`Target Collection:        ${ASTRA_DB_COLLECTION}`);
  console.log(`Total Execution Time:     ${totalTimeSec}s`);
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('Fatal error in Astra DB ingestion pipeline:', err);
  process.exit(1);
});
