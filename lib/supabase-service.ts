import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAstraLinksCollection } from './astra/client';
import { generateEmbedding } from './gemini';

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
 * Helper to query Astra DB 'rera_links' collection when project_documents is queried via SQL
 * Cloud-native document link search across local development and production.
 */
async function queryProjectDocumentsAstra(sqlQuery: string): Promise<any[] | null> {
  const collection = getAstraLinksCollection();
  if (!collection) {
    console.warn('Astra collection unavailable for project_documents fallback.');
    return null;
  }

  try {
    const projMatch = sqlQuery.match(/project_name\s+ILIKE\s+'%([^%']+)%'/i);
    const projectName = projMatch ? projMatch[1] : '';

    const regMatch = sqlQuery.match(/(?:krera_)?registration_number\s*(?:=|ILIKE)\s*'%?([^%']+)%?'/i);
    const regNumber = regMatch ? regMatch[1] : '';

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

    const limitMatch = sqlQuery.match(/LIMIT\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 50;

    const projectRegex = projectName ? new RegExp(projectName, 'i') : null;
    const keywordRegexes = keywords.map((kw) => new RegExp(kw, 'i'));

    let allChunks: any[] = [];

    // Case 1: When projectName is present (or exact regNumber is present)
    if (projectName || regNumber) {
      const targetRegNumbers: string[] = [];
      if (regNumber) {
        targetRegNumbers.push(regNumber);
      }

      // a) Resolve matching registration_numbers from Supabase krera_projects
      if (projectName) {
        try {
          const supabase = getSupabaseClient();
          if (supabase) {
            const { data: supaProjects } = await supabase
              .from('krera_projects')
              .select('registration_number, project_name')
              .ilike('project_name', `%${projectName}%`);

            if (supaProjects && Array.isArray(supaProjects)) {
              for (let i = 0; i < supaProjects.length; i++) {
                const reg = supaProjects[i]?.registration_number;
                if (reg && !targetRegNumbers.includes(reg)) {
                  targetRegNumbers.push(reg);
                }
              }
            }
          }
        } catch (supaErr) {
          console.warn('Could not query Supabase krera_projects for registration resolution:', supaErr);
        }

        // b) If no registration numbers were found from Supabase, run Astra vector search on project name only
        if (targetRegNumbers.length === 0) {
          try {
            const projEmbedding = await generateEmbedding(`Project Name: ${projectName}`);
            if (projEmbedding && projEmbedding.length > 0) {
              const projCursor = collection.find(
                {},
                { limit: 25, sort: { $vector: projEmbedding }, includeSimilarity: true }
              );
              const projChunks = await projCursor.toArray();
              for (let i = 0; i < projChunks.length; i++) {
                const chunk = projChunks[i];
                const chunkProjName = chunk.project_name || '';
                const chunkText = chunk.text || '';
                if ((projectRegex && projectRegex.test(chunkProjName)) || (projectRegex && projectRegex.test(chunkText))) {
                  const reg = chunk.registration_number;
                  if (reg && !targetRegNumbers.includes(reg)) {
                    targetRegNumbers.push(reg);
                  }
                }
              }
            }
          } catch (projEmbedErr) {
            console.warn('Failed project name vector lookup in Astra:', projEmbedErr);
          }
        }
      }

      // c) For each matched registration_number, query Astra DB exact filter { registration_number: regNum }
      for (let i = 0; i < targetRegNumbers.length; i++) {
        const regNum = targetRegNumbers[i];
        try {
          const regCursor = collection.find({ registration_number: regNum }, { limit: 30 });
          const regChunks = await regCursor.toArray();
          for (let j = 0; j < regChunks.length; j++) {
            const rc = regChunks[j];
            const rcId = rc._id || rc.id;
            if (!allChunks.some((c) => (c._id || c.id) === rcId)) {
              allChunks.push(rc);
            }
          }
        } catch (fetchErr) {
          console.warn(`Error fetching chunks for registration ${regNum}:`, fetchErr);
        }
      }
    } else {
      // Case 2: When projectName is NOT present in the SQL query (global queries like "any 5 airport NOCs")
      const docText = keywords.length > 0 ? keywords.join(' ') : 'statutory approval NOC clearance';
      let queryVector: number[] = [];
      try {
        queryVector = await generateEmbedding(docText);
      } catch (embedErr) {
        console.warn('Failed to generate embedding for Astra project_documents search:', embedErr);
      }

      const options: any = {
        limit: 25,
        includeSimilarity: true,
      };
      if (queryVector && queryVector.length > 0) {
        options.sort = { $vector: queryVector };
      }

      const cursor = collection.find({}, options);
      allChunks = await cursor.toArray();
    }

    const results: any[] = [];
    const seenLinks = new Set<string>();

    for (let i = 0; i < allChunks.length; i++) {
      const chunk = allChunks[i];
      const chunkProjName = chunk.project_name || '';
      if (projectRegex && !projectRegex.test(chunkProjName)) {
        continue;
      }

      const docItems: Array<{ document_name: string; document_link: string }> = [];

      // Parse from structured documents array if present
      if (Array.isArray(chunk.documents)) {
        for (let dIdx = 0; dIdx < chunk.documents.length; dIdx++) {
          const d = chunk.documents[dIdx];
          const docName = d.document_name || d.name || '';
          const docLink = d.document_link || d.link || '';
          if (docLink) {
            docItems.push({ document_name: docName, document_link: docLink });
          }
        }
      }

      // Parse from chunk.text lines (Astra DB format: 1. <name> - <link>)
      if (docItems.length === 0 && typeof chunk.text === 'string') {
        const lines = chunk.text.split('\n');
        for (let lIdx = 0; lIdx < lines.length; lIdx++) {
          const line = lines[lIdx];
          const lineMatch = line.match(/^\d+\.\s+(.+?)\s+-\s+(https?:\/\/\S+)/i);
          if (lineMatch) {
            docItems.push({
              document_name: lineMatch[1].trim(),
              document_link: lineMatch[2].trim(),
            });
          }
        }
      }

      for (let dIdx = 0; dIdx < docItems.length; dIdx++) {
        const doc = docItems[dIdx];
        const docName = doc.document_name;
        const docLink = doc.document_link;

        if (seenLinks.has(docLink)) continue;

        if (keywordRegexes.length === 0 || keywordRegexes.some((r) => r.test(docName))) {
          seenLinks.add(docLink);
          results.push({
            project_name: chunkProjName,
            document_name: docName,
            document_link: docLink,
          });
        }
      }
    }

    console.log(`[ASTRA DB DOCS] Retrieved ${results.length} matching documents for SQL query.`);
    return results.slice(0, limit);
  } catch (err) {
    console.error('Error querying project documents Astra DB:', err);
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

  // If querying project_documents table, query Astra DB directly (100% cloud-native)
  if (/FROM\s+project_documents\b/i.test(cleanSql)) {
    const docResults = await queryProjectDocumentsAstra(cleanSql);
    const data = docResults || [];
    return {
      success: true,
      sql: cleanSql,
      data,
      rowCount: data.length,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
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
        const docData = await queryProjectDocumentsAstra(cleanSql);
        if (docData !== null) {
          return {
            success: true,
            sql: cleanSql,
            data: docData,
            rowCount: docData.length,
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
