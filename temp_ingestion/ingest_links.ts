import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_INDEX = process.env.PINECONE_INDEX || process.env.PINECONE_INDEX_NAME || 'newreaa';
const PINECONE_HOST = process.env.PINECONE_HOST || '';
const PINECONE_NAMESPACE = 'rera-links';
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

const CHUNK_SIZE = 15; // At most 15 documents per chunk
const PINECONE_UPSERT_BATCH_SIZE = 100;
const RATE_LIMIT_DELAY_MS = 250; // Throttle between Gemini API calls

// Blacklisted document name patterns
const INVALID_DOC_NAMES = new Set([
  'document',
  'yes',
  'na.pdf',
  'not applicable.pdf',
  'not applicable',
  'not available.pdf',
  'not available',
  'na',
  'n/a',
  'null',
  'undefined',
  '-',
  '--',
]);

interface RawDocRow {
  rera_number: string;
  project_name: string;
  document_name: string;
  document_link: string;
}

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

// Helper to find input CSV file
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
  const cleanName = name.trim().toLowerCase();
  const cleanLink = link.trim().toLowerCase();

  if (cleanName.length < 2 || cleanLink.length < 5) return false;
  if (INVALID_DOC_NAMES.has(cleanName)) return false;
  if (cleanName.startsWith('document') && cleanName.length <= 10) return false;

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
      console.warn(`[Retry ${attempt}/${maxRetries}] Embedding API backoff (${delay}ms)... Error: ${err.message || err}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error('Embedding failed after retries');
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
  console.log('🚀 K-RERA "Smart Batching" Document Links Ingestion Pipeline');
  console.log('======================================================================');
  console.log(`Execution Mode:    ${isDryRun ? 'DRY-RUN (No API Calls)' : isFull ? 'FULL DATASET' : `SAMPLE RUN (Limit: ${limit} projects)`}`);
  console.log(`Target CSV Path:   ${csvPath}`);
  console.log(`Target Index:      ${PINECONE_INDEX}`);
  console.log(`Target Namespace:  ${PINECONE_NAMESPACE}`);
  console.log(`Embedding Model:   ${EMBEDDING_MODEL} (3072 dims)`);
  console.log(`Batch Size:        ${CHUNK_SIZE} docs/chunk | ${PINECONE_UPSERT_BATCH_SIZE} vectors/upsert`);
  console.log('======================================================================\n');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: CSV file not found at: ${csvPath}`);
    console.error(`Please provide the CSV path using: --file="C:\\path\\to\\krera_project_documents_final.csv"`);
    process.exit(1);
  }

  if (!isDryRun) {
    if (!GEMINI_API_KEY) {
      console.error('❌ Error: GEMINI_API_KEY is missing from environment variables.');
      process.exit(1);
    }
    if (!PINECONE_API_KEY) {
      console.error('❌ Error: PINECONE_API_KEY is missing from environment variables.');
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

      // Fallback column indexing if headers are standard
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
  // Step B: Smart Chunking (15 docs per chunk)
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
    console.log('🔍 DRY-RUN PREVIEW: Sample Formatted Payloads (First 3 Chunks)');
    console.log('======================================================================');
    allChunks.slice(0, 3).forEach((chunk, i) => {
      console.log(`\n[Chunk #${i + 1}] ID: ${chunk.id}`);
      console.log(`Metadata: { "project_name": "${chunk.project_name}", "registration_number": "${chunk.rera_number}", "doc_count": ${chunk.documents.length} }`);
      console.log(`--- Payload Text ---`);
      console.log(chunk.text);
      console.log(`--------------------\n`);
    });

    console.log('✅ Dry-Run completed successfully. Zero mutations made to Pinecone.');
    console.log('To ingest data, run with `--limit=50` or `--full`.');
    return;
  }

  // ----------------------------------------------------------------------------
  // Step D: Embedding Generation & Pinecone Upsert
  // ----------------------------------------------------------------------------
  console.log(`\n[Step 3/4] Initializing Pinecone and Gemini clients...`);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = PINECONE_HOST ? pc.index(PINECONE_INDEX, PINECONE_HOST) : pc.index(PINECONE_INDEX);
  const namespaceIndex = index.namespace(PINECONE_NAMESPACE);

  console.log(`[Step 4/4] Generating 3072-dim embeddings & upserting to [${PINECONE_NAMESPACE}]...`);

  let upsertBuffer: Array<{ id: string; values: number[]; metadata: Record<string, any> }> = [];
  let totalVectorsUpserted = 0;
  const startTime = Date.now();

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];

    try {
      const vector = await generateEmbeddingWithRetry(genAI, chunk.text);

      upsertBuffer.push({
        id: chunk.id,
        values: vector,
        metadata: {
          project_name: chunk.project_name,
          registration_number: chunk.rera_number,
          chunk_index: chunk.chunk_index,
          total_chunks: chunk.total_chunks,
          document_count: chunk.documents.length,
          text: chunk.text,
        },
      });

      // Throttle Gemini API calls
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));

      // Batch Upsert to Pinecone
      if (upsertBuffer.length >= PINECONE_UPSERT_BATCH_SIZE || i === allChunks.length - 1) {
        await namespaceIndex.upsert(upsertBuffer);
        totalVectorsUpserted += upsertBuffer.length;
        const pct = (((i + 1) / allChunks.length) * 100).toFixed(1);
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(` -> Upserted [${totalVectorsUpserted}/${allChunks.length}] vectors (${pct}%) - Elapsed: ${elapsedSec}s`);
        upsertBuffer = [];
      }
    } catch (err: any) {
      console.error(`❌ Failed processing chunk ${chunk.id}:`, err.message || err);
    }
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n======================================================================');
  console.log('🎉 INGESTION PIPELINE COMPLETE');
  console.log('======================================================================');
  console.log(`Total Vectors Upserted: ${totalVectorsUpserted.toLocaleString()}`);
  console.log(`Target Namespace:       ${PINECONE_NAMESPACE}`);
  console.log(`Total Execution Time:   ${totalTimeSec}s`);
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('Fatal error in ingestion pipeline:', err);
  process.exit(1);
});
