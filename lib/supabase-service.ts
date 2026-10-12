import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.warn('Supabase URL or Key missing from environment variables.');
    return null;
  }

  try {
    supabaseInstance = createClient(url.trim(), key.trim(), {
      auth: { persistSession: false },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export interface SqlExecutionResult {
  success: boolean;
  sql: string;
  data?: any;
  rowCount?: number;
  error?: string;
}

/**
 * Helper to query local krera_project_documents_final.csv when project_documents is queried via SQL
 */
async function queryProjectDocumentsCsv(sqlQuery: string): Promise<any[] | null> {
  const csvPath = path.resolve(process.cwd(), 'krera_project_documents_final.csv');
  if (!fs.existsSync(csvPath)) return null;

  try {
    const projMatch = sqlQuery.match(/project_name\s+ILIKE\s+'%([^%']+)%'/i);
    const projectName = projMatch ? projMatch[1] : '';

    const docRegex = /document_name\s+ILIKE\s+'%([^%']+)%'/gi;
    let keywords: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = docRegex.exec(sqlQuery)) !== null) {
      if (match[1]) keywords.push(match[1]);
    }

    // If keywords only mention height or clearance, automatically expand to include airport, aai, and noc
    if (keywords.length > 0 && keywords.some((kw) => /height|clearance/i.test(kw))) {
      keywords = Array.from(new Set([...keywords, 'airport', 'aai', 'noc']));
    }

    const projectRegex = projectName ? new RegExp(projectName, 'i') : null;
    const keywordRegexes = keywords.map((kw) => new RegExp(kw, 'i'));

    const fileStream = fs.createReadStream(csvPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const results: any[] = [];
    let isHeader = true;

    for await (const line of rl) {
      if (isHeader) {
        isHeader = false;
        continue;
      }
      if (projectRegex && !projectRegex.test(line)) continue;

      const lastComma = line.lastIndexOf(',');
      const docLink = line.substring(lastComma + 1).trim();
      const rest = line.substring(0, lastComma);
      const secondLastComma = rest.lastIndexOf(',');
      const docName = rest.substring(secondLastComma + 1).trim();
      const thirdLastComma = rest.substring(0, secondLastComma).lastIndexOf(',');
      const fourthLastComma = rest.substring(0, thirdLastComma).lastIndexOf(',');
      const fifthLastComma = rest.substring(0, fourthLastComma).lastIndexOf(',');
      const projName = rest.substring(0, fifthLastComma).trim();

      if (keywordRegexes.length === 0 || keywordRegexes.some((r) => r.test(docName))) {
        results.push({
          project_name: projName,
          document_name: docName,
          document_link: docLink,
        });
      }
    }

    return results;
  } catch (err) {
    console.error('Error querying project documents CSV:', err);
    return null;
  }
}

/**
 * Execute an agentic read-only SQL query against the Supabase PostgreSQL database
 */
export async function runAgenticSql(sqlQuery: string): Promise<SqlExecutionResult> {
  // Console logging for the generated SQL immediately before execution
  console.log('[DEBUG SQL GENERATED]:', sqlQuery);

  let cleanSql = sqlQuery.trim().replace(/;+$/, '');

  // Deterministic safeguard: If query contains literal %height clearance% or %height%, expand to include airport and aai
  if (/document_name\s+ILIKE\s+'%height(\s+clearance)?%'/i.test(cleanSql)) {
    cleanSql = cleanSql.replace(
      /document_name\s+ILIKE\s+'%height(\s+clearance)?%'/gi,
      "(document_name ILIKE '%airport%' OR document_name ILIKE '%aai%' OR document_name ILIKE '%noc%')"
    );
  }

  // Safety check: only allow SELECT / WITH queries
  const isReadOnly = /^(SELECT|WITH)\b/i.test(cleanSql);
  if (!isReadOnly) {
    return {
      success: false,
      sql: cleanSql,
      error: 'Security Violation: Only read-only SELECT or WITH statements are permitted.',
    };
  }

  // If querying project_documents table, query the document repository
  if (/FROM\s+project_documents\b/i.test(cleanSql)) {
    const csvData = await queryProjectDocumentsCsv(cleanSql);
    if (csvData !== null && csvData.length > 0) {
      return {
        success: true,
        sql: cleanSql,
        data: csvData,
        rowCount: csvData.length,
      };
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    // If Supabase is unconfigured but project documents were queried, try CSV
    if (/FROM\s+project_documents\b/i.test(cleanSql)) {
      const csvData = await queryProjectDocumentsCsv(cleanSql);
      if (csvData !== null) {
        return {
          success: true,
          sql: cleanSql,
          data: csvData,
          rowCount: csvData.length,
        };
      }
    }
    return {
      success: false,
      sql: cleanSql,
      error: 'Supabase client is not configured or missing credentials in environment.',
    };
  }

  try {
    // 1. Try calling the execute_sql RPC function
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: cleanSql,
    });

    if (error) {
      console.warn('Supabase RPC execute_sql warning:', error.message);

      // Fallback for project_documents if the table does not exist in Supabase
      if (/project_documents/i.test(cleanSql) || /project_documents/i.test(error.message)) {
        const csvData = await queryProjectDocumentsCsv(cleanSql);
        if (csvData !== null) {
          return {
            success: true,
            sql: cleanSql,
            data: csvData,
            rowCount: csvData.length,
          };
        }
      }

      return {
        success: false,
        sql: cleanSql,
        error: error.message || 'Error executing SQL query in Supabase.',
      };
    }

    const rowCount = Array.isArray(data) ? data.length : data ? 1 : 0;
    return {
      success: true,
      sql: cleanSql,
      data,
      rowCount,
    };
  } catch (err: any) {
    console.error('Fatal error in runAgenticSql:', err);
    return {
      success: false,
      sql: cleanSql,
      error: err.message || 'Unexpected error executing SQL.',
    };
  }
}

/**
 * Gemini Function Declaration for Text-to-SQL Tool
 */
export const KRERA_SQL_TOOL = {
  functionDeclarations: [
    {
      name: 'query_krera_sql_database',
      description: `Use this tool strictly for aggregate, statistical, quantitative, or global ranking queries (e.g., 'Top 5 projects with the most complaints', 'Total project cost in Bengaluru', 'Count of all litigations in 2024', 'Which promoter has the most ongoing projects?') and for official document links stored in project_documents. Do NOT use this for generic semantic search.

PostgreSQL Database Schema:
1. krera_projects(
     registration_number TEXT PRIMARY KEY,
     project_name TEXT,
     promoter_name TEXT,
     district TEXT,
     total_project_cost NUMERIC,
     status TEXT
   )
2. krera_complaints(
     complaint_number TEXT PRIMARY KEY,
     registration_number TEXT,
     project_name TEXT,
     promoter_name TEXT,
     forum TEXT,
     status TEXT
   )
3. krera_litigations(
     id SERIAL PRIMARY KEY,
     case_number TEXT,
     registration_number TEXT,
     project_name TEXT,
     promoter_name TEXT,
     court_name TEXT,
     case_type TEXT,
     status TEXT
   )
4. project_documents(
     id SERIAL PRIMARY KEY,
     registration_number TEXT,
     project_name TEXT,
     document_name TEXT,
     document_link TEXT
   )

Write clean PostgreSQL SELECT queries using appropriate aggregation (COUNT, SUM, AVG, GROUP BY, ORDER BY, LIMIT).

CRITICAL TABLE SELECTION & QUERY OVERRIDE:
If the user's prompt asks for "docs", "documents", "NOC", "clearance", or "links", you are STRICTLY FORBIDDEN from only querying the main projects table. You MUST query the table that contains the actual file URLs (e.g., \`project_documents\`, \`documents\`, or your specific schema's equivalent) that holds the \`document_link\` column.

When searching for clearance links, you MUST use this exact structural pattern to defeat developer naming errors:
SELECT project_name, document_name, document_link 
FROM <your_documents_table> 
WHERE project_name ILIKE '%<target_project>%' 
AND (
  document_name ILIKE '%airport%' 
  OR document_name ILIKE '%aai%' 
  OR document_name ILIKE '%noc%' 
  OR document_name ILIKE '%clearance%'
  OR document_name ILIKE '%fire%'
  OR document_name ILIKE '%pollution%'
);

EXAMPLE FOR STATUTORY CLEARANCES:
User: "provide height clearance docs for deansgate"
Generated SQL:
SELECT document_name, document_link 
FROM project_documents 
WHERE project_name ILIKE '%deansgate%' 
  AND (
    document_name ILIKE '%airport%' 
    OR document_name ILIKE '%aai%' 
    OR document_name ILIKE '%noc%'
  );

CRITICAL SQL RULE FOR DOCUMENTS:
You are strictly forbidden from placing multi-word strings inside an ILIKE clause. (e.g., NEVER write \`ILIKE '%height clearance%'\`).

If the user asks for ANY "clearance", "NOC", or "approval", you MUST use this exact structural block for your WHERE clause to catch misnamed developer files:
AND (
  document_name ILIKE '%<single_keyword>%' 
  OR document_name ILIKE '%airport%' 
  OR document_name ILIKE '%noc%' 
  OR document_name ILIKE '%aai%'
)

STRICT QUERY BOUNDING: Target ONLY the specific entity, project, locality, or scope requested. Do NOT run broad brand searches (e.g., searching all projects under a promoter name) or generate developer portfolio queries unless the user explicitly requests promoter footprint or multi-project due diligence.`,
      parameters: {
        type: 'OBJECT',
        properties: {
          sql_query: {
            type: 'STRING',
            description: 'The PostgreSQL read-only SELECT query to execute on the K-RERA database.',
          },
        },
        required: ['sql_query'],
      },
    },
  ],
};
