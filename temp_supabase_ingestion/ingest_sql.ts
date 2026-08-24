import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==============================================================================
// ANSI Color Helpers for Rich Console Logging
// ==============================================================================
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  bgBlue: '\x1b[44m',
};

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

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  '';

const BATCH_SIZE = 500;

// ==============================================================================
// 2. CSV File Resolution
// ==============================================================================
interface DatasetConfig {
  tableName: string;
  defaultFileNames: string[];
  conflictKey?: string;
  sanitizeRow: (raw: Record<string, any>) => Record<string, any>;
}

function resolveFilePath(customPath: string | undefined, defaultCandidates: string[]): string | null {
  if (customPath && fs.existsSync(customPath)) return path.resolve(customPath);

  for (const name of defaultCandidates) {
    const candidates = [
      path.resolve(process.cwd(), name),
      path.resolve(__dirname, name),
      path.resolve(__dirname, '..', name),
      path.resolve(process.cwd(), '..', name),
      path.resolve(process.cwd(), '..', 'supabase_injector', name),
      path.resolve(process.cwd(), '..', 'complaints_ingestion', name),
      path.resolve(process.cwd(), '..', 'Litigation_injestion', name),
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }

  return null;
}

// ==============================================================================
// 3. Row Sanitization Helpers
// ==============================================================================
function cleanValue(val: any): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (
    str === '' ||
    str.toLowerCase() === 'nan' ||
    str.toLowerCase() === 'null' ||
    str.toLowerCase() === 'undefined' ||
    str === '-' ||
    str === '--'
  ) {
    return null;
  }
  return str;
}

function cleanNumber(val: any): number | null {
  const cleaned = cleanValue(val);
  if (cleaned === null) return null;
  const num = parseFloat(cleaned.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ==============================================================================
// 4. Strict Schema-Aligned Dataset Mappings
// ==============================================================================
const DATASETS: Record<string, DatasetConfig> = {
  projects: {
    tableName: 'krera_projects',
    defaultFileNames: ['krera_projects.csv', 'Karnataka_RERA_All_Projects.csv'],
    conflictKey: 'registration_number',
    sanitizeRow: (raw: Record<string, any>) => {
      const regNo =
        cleanValue(raw['KRERA_Registration_Number']) ||
        cleanValue(raw['registration_number']) ||
        cleanValue(raw['Acknowledgement_Number']) ||
        cleanValue(raw['acknowledgement_number']) ||
        cleanValue(raw['Project_ID']) ||
        cleanValue(raw['project_id']);

      const projName =
        cleanValue(raw['Project_Name']) ||
        cleanValue(raw['project_name']) ||
        'Unknown Project';

      const promoterName =
        cleanValue(raw['Promoter_Name']) ||
        cleanValue(raw['promoter_name']);

      const district =
        cleanValue(raw['District']) ||
        cleanValue(raw['district']) ||
        cleanValue(raw['Search_District']) ||
        cleanValue(raw['search_district']);

      const totalCost =
        cleanNumber(raw['Estimated_Project_Cost_INR']) ||
        cleanNumber(raw['estimated_project_cost_inr']) ||
        cleanNumber(raw['total_project_cost']) ||
        cleanNumber(raw['Total_Project_Cost']);

      const status =
        cleanValue(raw['Normalized_Status']) ||
        cleanValue(raw['normalized_status']) ||
        cleanValue(raw['Current_Registration_Status']) ||
        cleanValue(raw['current_registration_status']) ||
        cleanValue(raw['Status']) ||
        cleanValue(raw['status']) ||
        'UNKNOWN';

      // STRICT SCHEMA OBJECT: ONLY return columns present in Supabase table
      return {
        registration_number: regNo,
        project_name: projName,
        promoter_name: promoterName,
        district: district,
        total_project_cost: totalCost,
        status: status,
      };
    },
  },

  complaints: {
    tableName: 'krera_complaints',
    defaultFileNames: [
      'krera_complaints_final.csv',
      'krera_project_and_promoter_complaints.csv',
      'validated_complaints.csv',
    ],
    conflictKey: 'complaint_number',
    sanitizeRow: (raw: Record<string, any>) => {
      const complaintNo =
        cleanValue(raw['Complaint_Number']) ||
        cleanValue(raw['complaint_number']) ||
        cleanValue(raw['CMP_NO']) ||
        cleanValue(raw['cmp_no']);

      const regNo =
        cleanValue(raw['KRERA_Registration_Number']) ||
        cleanValue(raw['registration_number']) ||
        cleanValue(raw['reg_no']);

      const projName =
        cleanValue(raw['Complaint_Project_Name']) ||
        cleanValue(raw['complaint_project_name']) ||
        cleanValue(raw['Project_Name']) ||
        cleanValue(raw['project_name']);

      const promoterName =
        cleanValue(raw['Complaint_Promoter_Name']) ||
        cleanValue(raw['complaint_promoter_name']) ||
        cleanValue(raw['Promoter_Name']) ||
        cleanValue(raw['promoter_name']);

      const forum =
        cleanValue(raw['Complaint_Source']) ||
        cleanValue(raw['complaint_source']) ||
        cleanValue(raw['Order_By']) ||
        cleanValue(raw['order_by']) ||
        cleanValue(raw['forum']) ||
        cleanValue(raw['court_name']);

      const status =
        cleanValue(raw['Complaint_Status']) ||
        cleanValue(raw['complaint_status']) ||
        cleanValue(raw['Status']) ||
        cleanValue(raw['status']);

      // STRICT SCHEMA OBJECT: ONLY return columns present in Supabase table
      return {
        complaint_number: complaintNo,
        registration_number: regNo,
        project_name: projName,
        promoter_name: promoterName,
        forum: forum,
        status: status,
      };
    },
  },

  litigation: {
    tableName: 'krera_litigations',
    defaultFileNames: [
      'krera_litigation_final.csv',
      'krera_land_litigation_restored.csv',
      'krera_land_litigation_corrected.csv',
    ],
    sanitizeRow: (raw: Record<string, any>) => {
      const caseNo =
        cleanValue(raw['case_number']) ||
        cleanValue(raw['Case_Number']) ||
        cleanValue(raw['case_no']);

      const regNo =
        cleanValue(raw['krera_registration_number']) ||
        cleanValue(raw['KRERA_Registration_Number']) ||
        cleanValue(raw['registration_number']);

      const projName =
        cleanValue(raw['project_name']) ||
        cleanValue(raw['Project_Name']);

      const promoterName =
        cleanValue(raw['promoter_name']) ||
        cleanValue(raw['Promoter_Name']);

      const courtName =
        cleanValue(raw['court_name']) ||
        cleanValue(raw['Court_Name']) ||
        cleanValue(raw['court']);

      const caseType =
        cleanValue(raw['case_type']) ||
        cleanValue(raw['Case_Type']) ||
        cleanValue(raw['case_title']) ||
        cleanValue(raw['Case_Title']);

      const status =
        cleanValue(raw['case_status']) ||
        cleanValue(raw['Case_Status']) ||
        cleanValue(raw['current_status']) ||
        cleanValue(raw['Current_Status']) ||
        cleanValue(raw['status']);

      // STRICT SCHEMA OBJECT: ONLY return columns present in Supabase table
      return {
        case_number: caseNo,
        registration_number: regNo,
        project_name: projName,
        promoter_name: promoterName,
        court_name: courtName,
        case_type: caseType,
        status: status,
      };
    },
  },
};

// ==============================================================================
// 5. In-Memory Batch Deduplication
// ==============================================================================
function deduplicateBatch(
  rows: Record<string, any>[],
  tableName: string,
  conflictKey?: string
): Record<string, any>[] {
  if (conflictKey) {
    const map = new Map<string, Record<string, any>>();
    const anonymousRows: Record<string, any>[] = [];

    for (const row of rows) {
      const keyVal = row[conflictKey];
      if (keyVal !== null && keyVal !== undefined && String(keyVal).trim() !== '') {
        // Retain the last occurrence of each key within this batch
        map.set(String(keyVal).trim().toUpperCase(), row);
      } else {
        anonymousRows.push(row);
      }
    }

    return [...Array.from(map.values()), ...anonymousRows];
  }

  // For litigation: composite deduplication on case_number + registration_number
  if (tableName === 'krera_litigations') {
    const map = new Map<string, Record<string, any>>();
    const anonymousRows: Record<string, any>[] = [];

    for (const row of rows) {
      const cNo = row.case_number ? String(row.case_number).trim().toUpperCase() : '';
      const rNo = row.registration_number ? String(row.registration_number).trim().toUpperCase() : '';
      const compositeKey = `${cNo}__${rNo}`;

      if (cNo || rNo) {
        map.set(compositeKey, row);
      } else {
        anonymousRows.push(row);
      }
    }

    return [...Array.from(map.values()), ...anonymousRows];
  }

  return rows;
}

// ==============================================================================
// 6. Ingestion Worker for a Single Dataset
// ==============================================================================
async function processDataset(
  name: string,
  config: DatasetConfig,
  supabase: SupabaseClient | null,
  options: { isDryRun: boolean; limit: number; customFile?: string }
): Promise<{ totalRead: number; totalInserted: number }> {
  const filePath = resolveFilePath(options.customFile, config.defaultFileNames);

  console.log(`\n${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bright}${c.blue}📂 Dataset: ${name.toUpperCase()} -> Table: [${config.tableName}]${c.reset}`);
  console.log(`${c.cyan}======================================================================${c.reset}`);

  if (!filePath) {
    console.warn(`${c.yellow}⚠️  Skipping ${name}: CSV file not found in workspace.${c.reset}`);
    console.warn(`   Checked candidates: ${config.defaultFileNames.join(', ')}`);
    return { totalRead: 0, totalInserted: 0 };
  }

  console.log(`Resolved CSV Path: ${c.dim}${filePath}${c.reset}`);

  let totalRead = 0;
  let totalInserted = 0;
  let rawBatch: Record<string, any>[] = [];
  let dryRunBatchCount = 0;
  const startTime = Date.now();

  const stream = fs.createReadStream(filePath).pipe(csv());

  for await (const rawRow of stream) {
    totalRead++;
    if (totalRead > options.limit) {
      break;
    }

    const sanitized = config.sanitizeRow(rawRow);
    rawBatch.push(sanitized);

    // When rawBatch reaches BATCH_SIZE
    if (rawBatch.length >= BATCH_SIZE) {
      const dedupedBatch = deduplicateBatch(rawBatch, config.tableName, config.conflictKey);

      if (options.isDryRun) {
        dryRunBatchCount++;
        if (dryRunBatchCount <= 2) {
          console.log(`\n${c.yellow}[DRY-RUN PREVIEW] Batch #${dryRunBatchCount} (${dedupedBatch.length} unique rows from ${rawBatch.length} raw) for ${config.tableName}:${c.reset}`);
          console.log(JSON.stringify(dedupedBatch[0], null, 2));
        }
        totalInserted += dedupedBatch.length;
        console.log(`${c.green} -> [DRY-RUN] Parsed batch of ${dedupedBatch.length} rows (Total: ${totalInserted})${c.reset}`);
      } else if (supabase) {
        await insertBatchWithRetry(supabase, config.tableName, dedupedBatch, config.conflictKey);
        totalInserted += dedupedBatch.length;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `${c.green} -> [${config.tableName}] Inserted ${totalInserted} rows (${dedupedBatch.length} unique from ${rawBatch.length} raw) - Elapsed: ${elapsed}s${c.reset}`
        );
      }
      rawBatch = [];
    }
  }

  // Flush remaining batch
  if (rawBatch.length > 0) {
    const dedupedBatch = deduplicateBatch(rawBatch, config.tableName, config.conflictKey);

    if (options.isDryRun) {
      dryRunBatchCount++;
      if (dryRunBatchCount <= 2) {
        console.log(`\n${c.yellow}[DRY-RUN PREVIEW] Final Batch (${dedupedBatch.length} unique rows from ${rawBatch.length} raw) for ${config.tableName}:${c.reset}`);
        console.log(JSON.stringify(dedupedBatch[0], null, 2));
      }
      totalInserted += dedupedBatch.length;
      console.log(`${c.green} -> [DRY-RUN] Parsed final batch of ${dedupedBatch.length} rows (Total: ${totalInserted})${c.reset}`);
    } else if (supabase) {
      await insertBatchWithRetry(supabase, config.tableName, dedupedBatch, config.conflictKey);
      totalInserted += dedupedBatch.length;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `${c.green} -> [${config.tableName}] Inserted ${totalInserted} rows (final ${dedupedBatch.length} unique from ${rawBatch.length} raw) - Elapsed: ${elapsed}s${c.reset}`
      );
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`${c.bright}${c.green}✔ Completed ${name}: ${totalInserted.toLocaleString()} rows processed in ${duration}s.${c.reset}`);
  return { totalRead, totalInserted };
}

// ==============================================================================
// 7. Supabase Batch Inserter with Conflict & Retry Handling
// ==============================================================================
async function insertBatchWithRetry(
  supabase: SupabaseClient,
  tableName: string,
  rows: Record<string, any>[],
  conflictKey?: string,
  maxRetries = 3
): Promise<void> {
  if (rows.length === 0) return;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let query;

      if (conflictKey) {
        query = supabase.from(tableName).upsert(rows, {
          onConflict: conflictKey,
          ignoreDuplicates: false,
        });
      } else {
        query = supabase.from(tableName).insert(rows);
      }

      const { error } = await query;

      if (error) {
        // Fallback to plain insert if onConflict fails or column doesn't have unique index
        if (conflictKey && (error.message?.includes('conflict') || error.code === '42P10')) {
          const fallback = await supabase.from(tableName).insert(rows);
          if (!fallback.error) return;
          throw fallback.error;
        }
        throw error;
      }

      return;
    } catch (err: any) {
      if (attempt === maxRetries) {
        console.error(`${c.red}❌ Failed inserting batch into ${tableName} after ${maxRetries} attempts: ${err.message || err}${c.reset}`);
        throw err;
      }
      console.warn(`${c.yellow}[Retry ${attempt}/${maxRetries}] Supabase insert backoff (${delay}ms)... Error: ${err.message || err}${c.reset}`);
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

// ==============================================================================
// 8. Main CLI Entry Point
// ==============================================================================
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isFull = args.includes('--full');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const targetArg = args.find((a) => a.startsWith('--target='));
  const projectsFile = args.find((a) => a.startsWith('--projects-file='))?.split('=')[1];
  const complaintsFile = args.find((a) => a.startsWith('--complaints-file='))?.split('=')[1];
  const litigationFile = args.find((a) => a.startsWith('--litigation-file='))?.split('=')[1];

  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : isDryRun ? 1000 : isFull ? Infinity : 500;
  const target = targetArg ? targetArg.split('=')[1].toLowerCase() : 'all';

  console.log(`${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bright}${c.magenta}🚀 K-RERA CSV to Supabase PostgreSQL Ingestion Engine${c.reset}`);
  console.log(`${c.cyan}======================================================================${c.reset}`);
  console.log(`Execution Mode:    ${isDryRun ? `${c.yellow}DRY-RUN (Zero DB Mutations)${c.reset}` : isFull ? `${c.green}FULL DATASET INGESTION${c.reset}` : `${c.blue}SAMPLE RUN (Limit: ${limit} rows/table)${c.reset}`}`);
  console.log(`Supabase URL:      ${SUPABASE_URL || `${c.red}MISSING${c.reset}`}`);
  console.log(`Batch Size:        ${BATCH_SIZE} rows/batch (in-memory deduplicated)`);
  console.log(`Target Tables:     ${target === 'all' ? 'krera_projects, krera_complaints, krera_litigations' : target}`);
  console.log(`${c.cyan}======================================================================${c.reset}`);

  if (!isDryRun) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error(`${c.red}❌ Error: SUPABASE_URL or SUPABASE_SECRET_KEY is missing from environment variables (.env / .env.local).${c.reset}`);
      process.exit(1);
    }
  }

  let supabase: SupabaseClient | null = null;
  if (!isDryRun) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  }

  const customFiles: Record<string, string | undefined> = {
    projects: projectsFile,
    complaints: complaintsFile,
    litigation: litigationFile,
  };

  const startTime = Date.now();
  const summary: Record<string, { totalRead: number; totalInserted: number }> = {};

  for (const [name, config] of Object.entries(DATASETS)) {
    if (target !== 'all' && target !== name) {
      continue;
    }

    summary[name] = await processDataset(name, config, supabase, {
      isDryRun,
      limit,
      customFile: customFiles[name],
    });
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bright}${c.green}🎉 SUPABASE INGESTION PIPELINE COMPLETE${c.reset}`);
  console.log(`${c.cyan}======================================================================${c.reset}`);
  for (const [name, stats] of Object.entries(summary)) {
    console.log(` -> Table [${DATASETS[name].tableName}]: ${stats.totalInserted.toLocaleString()} rows processed.`);
  }
  console.log(`Total Execution Time: ${totalTime}s`);
  console.log(`${c.cyan}======================================================================${c.reset}\n`);
}

main().catch((err) => {
  console.error(`${c.red}Fatal error in Supabase ingestion pipeline:${c.reset}`, err);
  process.exit(1);
});
