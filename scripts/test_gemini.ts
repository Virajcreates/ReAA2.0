import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load env
const envPaths = [
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

const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.error('GEMINI_API_KEY missing from environment.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testEmbedding() {
  const models = ['gemini-embedding-001', 'text-embedding-004', 'embedding-001'];
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.embedContent('K-RERA Section 18');
      console.log(`[SUCCESS] Embedding ${m} returned vector length:`, res.embedding.values.length);
      break;
    } catch (e: any) {
      console.log(`[FAILED] Embedding ${m}: ${e.message}`);
    }
  }
}

testEmbedding();
