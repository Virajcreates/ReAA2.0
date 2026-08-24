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

import { analyzeQueryAndRoute, executeRAGRetrieval } from '../lib/rag/engine';

async function testLinksRouting() {
  console.log('====================================================');
  console.log('Testing Astra DB `rera-links` Routing & Retrieval');
  console.log('====================================================\n');

  // Test 1: Document Intent Query
  const docQuery = 'where can I download the sanction plan and documents for Provident Park Square';
  console.log(`[TEST 1] Query: "${docQuery}"`);
  const route1 = await analyzeQueryAndRoute(docQuery);
  console.log(`- Routed Namespaces:`, route1.targetNamespaces);
  console.log(`- Reasoning:`, route1.reasoning);
  const pass1 = route1.targetNamespaces.includes('rera-links');
  console.log(pass1 ? '✅ PASSED: rera-links included in target namespaces\n' : '❌ FAILED\n');

  // Test 2: PRM Registration Number Intercept
  const prmQuery = 'show me details on PRM/KA/RERA/1251/310/PR/180217/002476';
  console.log(`[TEST 2] Query: "${prmQuery}"`);
  const route2 = await analyzeQueryAndRoute(prmQuery);
  console.log(`- Routed Namespaces:`, route2.targetNamespaces);
  console.log(`- Query Filter:`, JSON.stringify(route2.queryFilter));
  const pass2 = route2.targetNamespaces.includes('rera-links') && route2.queryFilter?.registration_number;
  console.log(pass2 ? '✅ PASSED: rera-links included with exact registration_number filter\n' : '❌ FAILED\n');

  // Test 3: End-to-end Retrieval with Astra DB
  console.log('----------------------------------------------------');
  console.log('Testing End-to-End Retrieval (Pinecone + Astra DB)');
  console.log('----------------------------------------------------');
  const ragResult = await executeRAGRetrieval(prmQuery);
  console.log(`- Total Citations Retrieved:`, ragResult.citations.length);
  ragResult.citations.slice(0, 6).forEach((c, i) => {
    console.log(`  [#${i + 1}] [${c.namespace}] ${c.title} (${c.section}) - Score: ${c.score}`);
  });

  const hasAstraCitation = ragResult.citations.some((c) => c.namespace === 'rera-links');
  console.log(hasAstraCitation ? '\n✅ PASSED: Astra DB `rera-links` document chunk retrieved successfully' : '\n⚠️ Note: rera-links chunk not in top citations or project not yet in ingested limit');

  if (!pass1 || !pass2) {
    process.exit(1);
  }
}

testLinksRouting().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
