'use client';

import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Sparkles,
  Database,
  Info,
  ExternalLink,
  Cpu,
  Server,
  FileCode2,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewConsultation: () => void;
  isSidebarOpen: boolean;
}

export const Header = React.memo(function Header({ onToggleSidebar, onNewConsultation, isSidebarOpen }: HeaderProps) {
  const [showArchitectureInfo, setShowArchitectureInfo] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 md:h-16 px-3.5 md:px-6 bg-black/80 backdrop-blur-xl border-b border-white/10 transition-colors">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl font-display font-black tracking-tight text-white select-none">
              REAA
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/15 font-mono">
                  K-RERA
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block font-sans">
                Hybrid Agentic Vector & SQL Advisory
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Architecture Pill & New Consultation */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Tri-Database Architecture Modal Trigger */}
          <button
            onClick={() => setShowArchitectureInfo(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all cursor-pointer"
            title="View Tri-Database Architecture (Pinecone + Astra DB + Supabase)"
          >
            <Database className="w-3.5 h-3.5 text-white" />
            <span className="hidden md:inline">Tri-Database Router</span>
            <span className="md:hidden text-[11px]">Architecture</span>
            <Info className="w-3 h-3 text-zinc-500 hidden sm:inline" />
          </button>

          {/* Model Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 text-xs font-medium font-mono">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Gemini Flash</span>
          </div>

          {/* New Consultation CTA */}
          <button
            onClick={onNewConsultation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Consultation</span>
          </button>
        </div>
      </header>

      {/* Tri-Database Architecture Modal */}
      {showArchitectureInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowArchitectureInfo(false)}
        >
          <div
            className="w-full max-w-2xl bg-black border border-white/12 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Tri-Database Hybrid RAG Topology
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Gemini Agentic Router distributes queries across 3 specialized storage engines
                  </p>
                </div>
              </div>
            </div>

            {/* Tri-Database Breakdown */}
            <div className="space-y-3">
              {/* Store 1: Pinecone */}
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] space-y-2 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white font-display">
                      1. Pinecone Vector DB (Dense Semantic Legal Corpus)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold border border-white/15">
                    3,072 Dims
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Hosts namespaces <code className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15">rera-legal</code>, <code className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15">rera-litigation</code>, <code className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15">rera-complaints</code>, and <code className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15">rera-projects</code> with dynamic top-K retrieval (up to 12 vectors for legal circulars).
                </p>
              </div>

              {/* Store 2: DataStax Astra DB */}
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] space-y-2 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white font-display">
                      2. DataStax Astra DB (Direct Document Links Store)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold border border-white/15">
                    rera_links
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Retrieves official government PDFs, sanction plans, commencement certificates (CC), and occupancy certificates (OC) from collection <code className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15">rera_links</code>.
                </p>
              </div>

              {/* Store 3: Supabase PostgreSQL */}
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] space-y-2 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white font-display">
                      3. Supabase PostgreSQL (Text-to-SQL Relational Engine)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold border border-white/15">
                    execute_sql RPC
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Executes agentic SQL queries via tool <code className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15">query_krera_sql_database</code> for global statistical aggregations and rankings across 9,800+ projects and 69,000+ complaints.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://rera.karnataka.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white hover:underline font-medium"
              >
                <span>Official K-RERA Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setShowArchitectureInfo(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-full bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
