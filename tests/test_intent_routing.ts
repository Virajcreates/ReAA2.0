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

async function runIntentRoutingTests() {
  console.log('====================================================');
  console.log('Testing Intent-Based Namespace Locking & Retrieval');
  console.log('====================================================\n');

  const testCases = [
    {
      query: 'what are the litigations on Provident Deansgate',
      expectedNamespaces: ['rera-litigation'],
      description: 'Litigation Intent Query',
    },
    {
      query: 'what are the complaints on Provident Deansgate',
      expectedNamespaces: ['rera-complaints'],
      description: 'Complaint Intent Query',
    },
    {
      query: 'what is the completion date and status of Provident Deansgate',
      expectedNamespaces: ['rera-projects'],
      description: 'Project Intent Query',
    },
    {
      query: 'can you give me details on this complaint number ? CMP/190501/0002703',
      expectedNamespaces: ['rera-complaints', 'rera-litigation'],
      description: 'Exact Regex ID Intercept',
    },
    {
      query: 'what are the complaints and litigations on Provident Deansgate',
      expectedNamespaces: ['rera-litigation', 'rera-complaints'],
      description: 'Multi-Intent Query',
    },
  ];

  let allPassed = true;

  for (const tc of testCases) {
    console.log(`[TEST] ${tc.description}`);
    console.log(`Query: "${tc.query}"`);
    const routing = await analyzeQueryAndRoute(tc.query);
    console.log(`- Routed Namespaces:`, routing.targetNamespaces);
    console.log(`- Reasoning:`, routing.reasoning);

    const isMatch =
      tc.expectedNamespaces.length === routing.targetNamespaces.length &&
      tc.expectedNamespaces.every((ns) => routing.targetNamespaces.includes(ns as any));

    if (isMatch) {
      console.log(`✅ PASSED\n`);
    } else {
      console.log(`❌ FAILED: Expected [${tc.expectedNamespaces.join(', ')}], got [${routing.targetNamespaces.join(', ')}]\n`);
      allPassed = false;
    }
  }

  // End-to-end retrieval check for litigation query
  console.log('----------------------------------------------------');
  console.log('Running End-to-End Retrieval for: "what are the litigations on Provident Deansgate"');
  console.log('----------------------------------------------------');
  const ragResult = await executeRAGRetrieval('what are the litigations on Provident Deansgate');
  console.log(`- Locked Namespaces:`, ragResult.routedNamespaces);
  console.log(`- Total Citations Retrieved:`, ragResult.citations.length);
  ragResult.citations.slice(0, 3).forEach((c, i) => {
    console.log(`  [#${i + 1}] [${c.namespace}] ${c.title} (${c.section}) - Score: ${c.score}`);
  });

  const hasNonLitigationPinecone = ragResult.citations.some(
    (c) => c.namespace !== 'rera-litigation' && !c.id.startsWith('rera-legal-') && !c.id.startsWith('rera-lit-')
  );

  if (hasNonLitigationPinecone) {
    console.log('❌ Cross-namespace leakage detected!');
    allPassed = false;
  } else {
    console.log('✅ Zero cross-namespace leakage in Pinecone retrieval!');
  }

  if (!allPassed) {
    process.exit(1);
  }
}

runIntentRoutingTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
