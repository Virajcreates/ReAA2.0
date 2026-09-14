# REAA
**Karnataka Real Estate Regulatory Authority Advisory Intelligence**

REAA is a premium, AI-driven legal and statistical advisory platform built to navigate and analyze the Karnataka Real Estate Regulatory Authority (K-RERA) framework. Designed with a strictly monochromatic, high-performance aesthetic, REAA leverages a dual-engine architecture to seamlessly route between semantic legal document retrieval (RAG) and structured PostgreSQL statistical analytics.

## Key Features

* **Dual-Engine Agentic Routing:** Intelligently routes user queries between a vector-based legal document search (for statutory interpretation of the K-RERA Act and Rules) and a Text-to-SQL engine (for data aggregation and project statistics).
* **Multimodal PDF Analysis:** Users can upload real estate agreements, statutory clearances, or scanned brochures directly into the chat. The system utilizes Gemini 3.5 Flash to perform native vision-based extraction and analysis of typed text and scanned handwriting across English, Kannada, and Hindi.
* **Ephemeral Secure Storage:** Uploaded sensitive legal documents are securely handled via Supabase Storage and subjected to an automated 1-hour Time-to-Live (TTL) deletion cycle, ensuring zero long-term data retention liabilities.
* **Tenant-Isolated Data Architecture:** Powered by Supabase PostgreSQL with strict Row Level Security (RLS) policies, guaranteeing that all `consultations` and `messages` are cryptographically isolated to the authenticated user.
* **Premium Monochromatic Interface:** Features a minimalist, pure black-and-white (Uber/Grok-inspired) UI, a lightweight cinematic HTML5 video background loop for the authentication flow, and high-contrast electric blue semantic citation pills.

## Technology Stack

* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS (Strict B&W with electric blue `text-blue-400` hyperlinks)
* **Database & Auth:** Supabase (PostgreSQL, Google OAuth, Storage)
* **AI Engine:** Google Gemini 3.5 Flash (for RAG, SQL generation, and Multimodal Vision)
* **Background Rendering:** Hardware-accelerated HTML5 `<video>` loops with custom CSS masking and localized branding overlays.

## System Architecture

### 1. The RAG Pipeline (Statutory Intelligence)
When a user asks a legal or procedural question (e.g., "What is the penalty for delayed possession under Section 18?"), the agent queries the embedded K-RERA gazettes, judicial precedents, and regulatory rules. It returns highly accurate, cited answers formatted with interactive blue citation pills that link directly to the source documents.

### 2. The Text-to-SQL Pipeline (Statistical Analytics)
When a query requires mathematical aggregation (e.g., "Count the total number of delayed projects in Bengaluru Urban"), the agent translates the natural language into a secure PostgreSQL query, executes it against the RERA database, and formats the output into clean Markdown tables.

### 3. The Multimodal Pipeline (Document Verification)
PDFs uploaded via the chat interface bypass traditional, heavy OCR libraries. The Next.js backend intercepts the file from the `temp_documents` bucket and passes the raw buffer to Gemini 3.5 Flash, which natively reads tables, stamps, and multi-language text to cross-examine developer claims against K-RERA standards.

## Database Automation (pg_cron)

To maintain absolute data privacy for users uploading sensitive real estate agreements, the Supabase PostgreSQL database is configured with an automated chron job. Every 15 minutes, the database sweeps the `temp_documents` storage bucket and permanently deletes any file older than 1 hour. 

## Getting Started

### Prerequisites
* Node.js 18.x or later
* A Supabase project (Database, Auth, and Storage)
* A Google Gemini API Key with access to `gemini-3.5-flash`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/reaa.git
   cd reaa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory and add the following keys. Never commit this file to version control.
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Vercel Deployment

This project is optimized for deployment on Vercel.

1. Push your `main` branch to your GitHub repository.
2. Import the repository into your Vercel dashboard.
3. Before initiating the build, navigate to Settings > Environment Variables in Vercel and paste your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY`.
4. Deploy. Vercel will automatically detect the Next.js framework and build the production assets.

## Disclaimer

REAA is an advisory intelligence system designed to interpret K-RERA statutory guidelines and aggregate real estate data. It does not substitute for formal, advocate-client privileged legal counsel. Users should verify critical property decisions and project statuses directly on the official Karnataka Real Estate Regulatory Authority web portal.
