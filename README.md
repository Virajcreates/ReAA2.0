# ReAA 2.0: Hybrid Agentic RAG Engine for K-RERA

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash-orange?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-green?style=for-the-badge&logo=pinecone)](https://www.pinecone.io/)
[![DataStax Astra DB](https://img.shields.io/badge/DataStax-Astra%20DB-purple?style=for-the-badge&logo=apachecassandra)](https://astra.datastax.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20SQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%203.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📌 Overview

**ReAA 2.0 (Real Estate Advisory Agent)** is a domain-specialized, autonomous AI advisory engine engineered for the **Karnataka Real Estate Regulatory Authority (K-RERA)** ecosystem. 

By combining **dense vector retrieval** with **relational Text-to-SQL function calling**, ReAA 2.0 bridges statutory legal grounding with quantitative intelligence across:
- **9,800+** Registered K-RERA Projects
- **52,500+** Consumer & Promoter Complaints
- **16,500+** Land & Project Litigations
- **200,000+** Official Project Documents & Downloadable PDF Links (Sanction Plans, NOCs, Occupancy Certificates)
- Complete statutory statutory corpus of the **Real Estate (Regulation and Development) Act, 2016**, **Karnataka RERA Rules 2017**, and landmark **Supreme Court & High Court Precedents**.

---

## 🏗️ System Architecture: The Tri-Database Router

ReAA 2.0 employs an intelligent query-classification and function-calling router powered by **Google Gemini** that dynamically distributes queries across three dedicated database engines based on query intent:

```mermaid
flowchart TD
    UserQuery["👤 User Natural Language Query"] --> QueryRouter{"🧠 Gemini Intent & Function Router"}

    %% Tri-Database Routing Branches
    QueryRouter -->|"1. Semantic & Statutory Intent\n(Act Provisions, Rulings, Case Law)"| PineconeCluster[("🌲 Pinecone Vector DB\n(Namespaces: legal, projects, complaints, litigation)")]
    QueryRouter -->|"2. Document & Download Intent\n(Brochures, Plans, NOCs, PDFs)"| AstraDBCluster[("⚡ DataStax Astra DB\n(Collection: rera_links)")]
    QueryRouter -->|"3. Aggregate & Statistical Intent\n(Top Rankings, Cost Sums, Counts)"| SupabaseCluster[("🐘 Supabase PostgreSQL\n(RPC: execute_sql / Text-to-SQL)")]

    %% Execution & Synthesis
    PineconeCluster --> ContextFusion["🧩 Hybrid Context Fusion & Grounding Engine"]
    AstraDBCluster --> ContextFusion
    SupabaseCluster --> ContextFusion

    ContextFusion --> GeminiSynthesis["🤖 Gemini Flash Synthesis Engine\n(Strict Verbatim Grounding & Markdown Formatter)"]
    GeminiSynthesis --> SSEStream["📡 Server-Sent Events (SSE) Stream to Frontend UI"]
```

### 1. 🌲 Dense Semantic Search (`Pinecone`)
- **Namespaces**: `rera-legal`, `rera-projects`, `rera-complaints`, `rera-litigation`.
- **Dimensions**: 3,072-dimensional embeddings via `gemini-embedding-001`.
- **Role**: Semantic matching across dense legal circulars, project histories, complaint narratives, and court case summaries. Features dynamic top-K context expansion (12 for legal circulars, 5 for structured records).

### 2. ⚡ Direct Document & PDF Retrieval (`DataStax Astra DB`)
- **Collection**: `rera_links` (Cosine Metric, 3,072 dimensions).
- **Role**: High-throughput semantic retrieval of official government document links, layout plans, commencement certificates (CC), and occupancy certificates (OC) with zero rate limiting.

### 3. 🐘 Statistical & Aggregate Text-to-SQL (`Supabase PostgreSQL`)
- **Tables**: `krera_projects`, `krera_complaints`, `krera_litigations`.
- **Role**: Executed via the `query_krera_sql_database` Gemini tool calling interface. Translates global quantitative queries (*"Top 5 districts with the most projects"*, *"Promoters with >10 complaints"*, *"Total project cost in Bengaluru"*) into optimized SQL `SELECT` statements with in-database aggregation.

---

## ✨ Key Features

- **Autonomous Tool Calling**: Automatically triggers the Supabase SQL tool for quantitative calculations and switches to vector stores for qualitative legal interpretations.
- **Strict Verbatim Grounding**: Eliminates hallucinations in regulatory numbers, ministry circulars, and case codes by strictly extracting alphanumeric references directly from retrieved context.
- **In-Memory Streaming ETL Pipelines**:
  - `temp_supabase_ingestion/`: High-performance streaming parser with memory-efficient 500-row batching, intra-batch `Map` deduplication, and exponential backoff retry.
  - `temp_astra_ingestion/`: Smart-batching vectorizer chunking project documents into semantic vector groups of 30.
- **Clickable Markdown Hyperlinks**: Automatically detects document links in AI responses and renders them with secure, external-tab `<a>` tags with inline icon indicators.
- **Real-Time SSE Streaming**: Live status indicators displaying query routing decisions, retrieved citations, and token-by-token advisory generation.

---

## 📂 Project Structure

```bash
ReAA2.0/
├── app/
│   ├── api/chat/route.ts      # Main SSE Chat Streaming Endpoint & Tool Execution
│   ├── layout.tsx             # Root layout with Tailwind dark mode support
│   └── page.tsx               # Primary AI Legal Advisory Chat Interface
├── components/
│   └── chat/
│       ├── ChatInterface.tsx  # Main interactive chat UI with state management
│       ├── MessageItem.tsx    # Markdown renderer with clickable external document links
│       └── CitationViewer.tsx # Interactive drawer for verified statutory citations
├── lib/
│   ├── astra/
│   │   └── client.ts          # Singleton DataStax Astra DB client
│   ├── rag/
│   │   ├── engine.ts          # Multi-Store Hybrid RAG Engine (Pinecone + Astra DB)
│   │   └── prompts.ts         # Statutory grounding directives & system prompts
│   ├── gemini.ts              # Google Generative AI client configuration
│   └── supabase-service.ts    # Supabase PostgreSQL Text-to-SQL execution engine
├── temp_supabase_ingestion/
│   └── ingest_sql.ts          # Streaming CSV-to-PostgreSQL batch ingestion engine
├── temp_astra_ingestion/
│   └── ingest_astra_links.ts  # Smart-batching CSV-to-Astra DB document vectorizer
├── .env.example               # Environment variables template
└── package.json               # Node.js dependencies and scripts
```

---

## 🚀 Quick Start & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** / **pnpm**

### 2. Clone the Repository
```bash
git clone https://github.com/Virajcreates/ReAA2.0.git
cd ReAA2.0
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory by copying `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your respective API keys:
```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

# Pinecone Vector DB
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_HOST=https://your-pinecone-host.pinecone.io
PINECONE_INDEX=newreaa

# DataStax Astra DB
ASTRA_DB_API_ENDPOINT=https://your-astra-db-endpoint.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:your_astra_token
ASTRA_DB_COLLECTION=rera_links

# Supabase PostgreSQL
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 5. Run Database Ingestion (Optional)
To ingest CSV datasets into your databases:

```bash
# Ingest document links into Astra DB
npx tsx temp_astra_ingestion/ingest_astra_links.ts --full

# Ingest projects, complaints, and litigations into Supabase
npx tsx temp_supabase_ingestion/ingest_sql.ts --full
```

### 6. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) (or [http://localhost:3000](http://localhost:3000)) in your browser.

---

## 🧪 Testing & Diagnostics

ReAA 2.0 includes standalone test runners to validate vector and relational queries independently:

```bash
# Test multi-store hybrid vector retrieval (Pinecone + Astra DB)
npx tsx tests/test_links_routing.ts

# Test agentic Text-to-SQL execution against Supabase
npx tsx tests/test_sql_agent.ts
```

---

## 📜 Legal Disclaimer
*ReAA 2.0 is an AI advisory research tool built to assist homebuyers, legal professionals, and real estate researchers in navigating Karnataka Real Estate Regulatory Authority public disclosures, provisions, and judicial precedents. Output generated does not constitute binding formal legal counsel.*

---

## 👨‍💻 Author & Contributions
- **Created by**: [Virajcreates](https://github.com/Virajcreates)
- **Repository**: [https://github.com/Virajcreates/ReAA2.0](https://github.com/Virajcreates/ReAA2.0)
- **License**: MIT
