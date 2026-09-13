const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env
const env = {};
const envPath = path.resolve(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const idx = t.indexOf('=');
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
});

const url = env.SUPABASE_URL || process.env.SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function checkTables() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('consultations', 'messages')"
  });
  return { tables: data?.map(d => d.table_name) || [], error };
}

async function main() {
  console.log('Checking current Supabase schema...');
  const { tables } = await checkTables();
  console.log('Existing target tables:', tables);

  const sqlFile = path.resolve(__dirname, '..', 'supabase', 'migrations', '20260913_auth_consultations_messages_rls.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  console.log('\nMigration SQL loaded from:', sqlFile);
  console.log('Migration SQL length:', sqlContent.length, 'characters.');

  if (tables.includes('consultations') && tables.includes('messages')) {
    console.log('✓ Both consultations and messages tables are already present in the database.');
  } else {
    console.log('\nApplying migration to Supabase...');
    // If tables are not present, log instructions for applying the migration
    console.log('Please note: If direct DDL is restricted through PostgREST RPC, you can execute the contents of 20260913_auth_consultations_messages_rls.sql in the Supabase Dashboard SQL Editor.');
  }
}

main().catch(console.error);
