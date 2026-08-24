import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPaths = [path.resolve(process.cwd(), '.env.local'), path.resolve(process.cwd(), '.env')];
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

import { runAgenticSql, KRERA_SQL_TOOL } from '../lib/supabase-service';
import { getGeminiClient } from '../lib/gemini';

async function testSqlAgent() {
  console.log('====================================================');
  console.log('Testing Supabase Text-to-SQL Agentic Execution');
  console.log('====================================================\n');

  const gemini = getGeminiClient();
  if (!gemini) {
    console.error('Gemini client not initialized.');
    process.exit(1);
  }

  const model = gemini.getGenerativeModel({
    model: 'gemini-3.6-flash',
    tools: [KRERA_SQL_TOOL as any],
  });

  const prompt = 'What are the top 5 districts with the highest number of registered K-RERA projects and how many are there?';
  console.log(`Prompt: "${prompt}"\n`);

  const response = await model.generateContent(prompt);
  const functionCalls = response.response.functionCalls();

  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    console.log(`🤖 Gemini decided to call function: [${call.name}]`);
    console.log('Generated SQL:', (call.args as any).sql_query);

    const sqlExecution = await runAgenticSql((call.args as any).sql_query);
    console.log('\n📊 SQL Execution Output:', sqlExecution);

    // Synthesize final response
    const synthesisModel = gemini.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const synthesisPrompt = `You executed the following SQL query on the K-RERA Supabase PostgreSQL database:
\`\`\`sql
${sqlExecution.sql}
\`\`\`

DATABASE QUERY RESULTS (${sqlExecution.rowCount} rows):
\`\`\`json
${JSON.stringify(sqlExecution.data, null, 2)}
\`\`\`

USER QUESTION:
${prompt}

Please synthesize a comprehensive, authoritative Markdown response presenting the findings with clean tables and key takeaways.`;

    const finalResponse = await synthesisModel.generateContent(synthesisPrompt);
    console.log('\n📄 Final Synthesized Answer:\n');
    console.log(finalResponse.response.text());
  } else {
    console.log('Direct response:');
    console.log(response.response.text());
  }
}

testSqlAgent().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
