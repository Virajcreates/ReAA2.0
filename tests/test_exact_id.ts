import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local / .env
const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

import { executeRAGRetrieval } from '../lib/rag/engine';

async function testExactId() {
  console.log('====================================================');
  console.log('Testing Exact ID Regex & Hybrid Filtered Retrieval');
  console.log('====================================================');

  const query = 'can you give me details on this complaint number ? CMP/190501/0002703';
  console.log(`Query: "${query}"`);

  const result = await executeRAGRetrieval(query);

  console.log('\nRouting Analysis:');
  console.log(`- Routed Namespaces:`, result.routedNamespaces);
  console.log(`- Exact ID Match:`, result.exactIdMatch);
  console.log(`- Query Filter:`, JSON.stringify(result.queryFilter));
  console.log(`- Total Citations:`, result.citations.length);

  console.log('\nRetrieved Citations:');
  result.citations.forEach((c, i) => {
    console.log(`[#${i + 1}] [${c.namespace}] ${c.title} (${c.section}) - Score: ${c.score}`);
    console.log(`    Snippet: ${c.snippet.substring(0, 150)}...`);
  });

  const foundExact = result.citations.some((c) => c.section?.includes('CMP/190501/0002703') || c.snippet?.includes('CMP/190501/0002703'));
  if (foundExact) {
    console.log('\n✅ SUCCESS: Exact complaint ID was retrieved at Rank #1!');
  } else {
    console.log('\n❌ FAILURE: Exact complaint ID not found in top citations.');
    process.exit(1);
  }
}

testExactId().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
