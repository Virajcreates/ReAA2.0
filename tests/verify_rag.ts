import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

// Helper to manually load environment variables from .env.local and .env
function loadEnv() {
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
}

loadEnv();

async function runVerifyRAG() {
  console.log('====================================================');
  console.log('🚀 Starting Headless K-RERA RAG Integration Test');
  console.log('====================================================');

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const pineconeIndexName = process.env.PINECONE_INDEX || process.env.PINECONE_INDEX_NAME || 'newreaa';
  const pineconeHost = process.env.PINECONE_HOST;
  const chatModelName = process.env.GEMINI_CHAT_MODEL || 'gemini-3.5-flash';
  const embeddingModelName = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

  console.log('Configuration Check:');
  console.log(`- Gemini API Key: ${geminiApiKey ? '✅ Present' : '❌ Missing'}`);
  console.log(`- Pinecone API Key: ${pineconeApiKey ? '✅ Present' : '❌ Missing'}`);
  console.log(`- Pinecone Index: ${pineconeIndexName}`);
  console.log(`- Pinecone Host: ${pineconeHost || 'Auto'}`);
  console.log(`- Chat Model: ${chatModelName}`);
  console.log(`- Embedding Model: ${embeddingModelName}`);

  const userQuery = 'tell me about prestige park grov';
  const targetNamespace = 'rera-projects';

  console.log('\n----------------------------------------------------');
  console.log(`📌 Step 1: Generating Google Embedding for query: "${userQuery}"`);
  console.log('----------------------------------------------------');

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not defined.');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const embeddingModel = genAI.getGenerativeModel({ model: embeddingModelName });

  const embedResult = await embeddingModel.embedContent(userQuery);
  const queryVector = embedResult.embedding.values;
  console.log(`✅ Embedding generated successfully! Dimensions: ${queryVector.length}`);

  console.log('\n----------------------------------------------------');
  console.log(`📌 Step 2: Querying Pinecone namespace [${targetNamespace}]`);
  console.log('----------------------------------------------------');

  if (!pineconeApiKey) {
    throw new Error('PINECONE_API_KEY is not defined.');
  }

  const pinecone = new Pinecone({ apiKey: pineconeApiKey });
  const index = pineconeHost ? pinecone.index(pineconeIndexName, pineconeHost) : pinecone.index(pineconeIndexName);

  const queryResponse = await index.namespace(targetNamespace).query({
    vector: queryVector,
    topK: 5,
    includeMetadata: true,
  });

  const matches = queryResponse.matches || [];
  console.log(`✅ Retrieved ${matches.length} matches from namespace '${targetNamespace}':\n`);

  matches.forEach((match, i) => {
    console.log(`[Match #${i + 1}] ID: ${match.id} (Score: ${(match.score || 0).toFixed(4)})`);
    console.log(`Metadata:`, JSON.stringify(match.metadata, null, 2));
    console.log('---');
  });

  console.log('\n----------------------------------------------------');
  console.log(`📌 Step 3: Streaming Gemini Response Grounded on Pinecone Context`);
  console.log('----------------------------------------------------');

  const contextText = matches
    .map((m, i) => {
      const meta = m.metadata || {};
      const title = meta.project_name || meta.title || meta.name || m.id;
      const text = meta.text || meta.content || meta.description || JSON.stringify(meta);
      return `[Record #${i + 1}] ${title}:\n${text}`;
    })
    .join('\n\n---\n\n');

  const systemInstruction = `You are the K-RERA Advisory AI Assistant specialized in Karnataka Real Estate Regulatory Authority. Ground your answer in the retrieved project context. Provide clear details on project name, promoter, registration details, approvals, location, and completion dates if available.`;

  const prompt = `### RETRIEVED CONTEXT (Namespace: ${targetNamespace}):
${contextText}

### USER QUERY:
${userQuery}

### INSTRUCTIONS:
Provide a comprehensive answer regarding Prestige Park Grove based on the retrieved K-RERA records above.`;

  // Try primary model, fallback if unavailable
  let chatModel;
  try {
    chatModel = genAI.getGenerativeModel({
      model: chatModelName,
      systemInstruction,
    });
  } catch {
    chatModel = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction,
    });
  }

  try {
    const result = await chatModel.generateContentStream(prompt);
    console.log('Streaming output:\n');
    for await (const chunk of result.stream) {
      process.stdout.write(chunk.text());
    }
    console.log('\n\n✅ Headless test completed successfully!');
  } catch (err: any) {
    if (err.message && err.message.includes('not found') || err.message.includes('404')) {
      console.log(`\n⚠️ Model ${chatModelName} not available, retrying with gemini-3.5-flash...`);
      const fallbackModel = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        systemInstruction,
      });
      const result = await fallbackModel.generateContentStream(prompt);
      console.log('Streaming output from gemini-3.5-flash:\n');
      for await (const chunk of result.stream) {
        process.stdout.write(chunk.text());
      }
      console.log('\n\n✅ Headless test completed successfully via fallback model!');
    } else {
      throw err;
    }
  }
}

runVerifyRAG().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
