import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
 * Execute an agentic read-only SQL query against the Supabase PostgreSQL database
 */
export async function runAgenticSql(sqlQuery: string): Promise<SqlExecutionResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      sql: sqlQuery,
      error: 'Supabase client is not configured or missing credentials in environment.',
    };
  }

  const cleanSql = sqlQuery.trim().replace(/;+$/, '');

  // Safety check: only allow SELECT / WITH queries
  const isReadOnly = /^(SELECT|WITH)\b/i.test(cleanSql);
  if (!isReadOnly) {
    return {
      success: false,
      sql: cleanSql,
      error: 'Security Violation: Only read-only SELECT or WITH statements are permitted.',
    };
  }

  try {
    // 1. Try calling the execute_sql RPC function
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: cleanSql,
    });

    if (error) {
      console.warn('Supabase RPC execute_sql warning:', error.message);
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
      description: `Use this tool strictly for aggregate, statistical, quantitative, or global ranking queries (e.g., 'Top 5 projects with the most complaints', 'Total project cost in Bengaluru', 'Count of all litigations in 2024', 'Which promoter has the most ongoing projects?'). Do NOT use this for semantic search or single document downloads.

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

Write clean PostgreSQL SELECT queries using appropriate aggregation (COUNT, SUM, AVG, GROUP BY, ORDER BY, LIMIT).`,
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
