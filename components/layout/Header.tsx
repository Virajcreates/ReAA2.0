'use client';

import React, { useState } from 'react';
import {
  Scale,
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

export function Header({ onToggleSidebar, onNewConsultation, isSidebarOpen }: HeaderProps) {
  const [showArchitectureInfo, setShowArchitectureInfo] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 md:h-16 px-3.5 md:px-6 bg-[#0b0f19]/85 backdrop-blur-xl border-b border-slate-800/80 transition-colors">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-850 transition-colors cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm md:text-base text-slate-100 tracking-tight">
                  ReAA 2.0
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
                  K-RERA
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-300 border border-slate-750 hover:border-blue-500/40 text-xs font-medium transition-all cursor-pointer shadow-2xs"
            title="View Tri-Database Architecture (Pinecone + Astra DB + Supabase)"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Tri-Database Router</span>
            <span className="md:hidden text-[11px]">Architecture</span>
            <Info className="w-3 h-3 text-slate-400 hidden sm:inline" />
          </button>

          {/* Model Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/30 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Gemini Flash</span>
          </div>

          {/* New Consultation CTA */}
          <button
            onClick={onNewConsultation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Consultation</span>
          </button>
        </div>
      </header>

      {/* Tri-Database Architecture Modal */}
      {showArchitectureInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowArchitectureInfo(false)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    Tri-Database Hybrid RAG Topology
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gemini Agentic Router distributes queries across 3 specialized storage engines
                  </p>
                </div>
              </div>
            </div>

            {/* Tri-Database Breakdown */}
            <div className="space-y-3">
              {/* Store 1: Pinecone */}
              <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-100">
                      1. Pinecone Vector DB (Dense Semantic Legal Corpus)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                    3,072 Dims
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hosts namespaces <code className="text-blue-300">rera-legal</code>, <code className="text-blue-300">rera-litigation</code>, <code className="text-blue-300">rera-complaints</code>, and <code className="text-blue-300">rera-projects</code> with dynamic top-K retrieval (up to 12 vectors for legal circulars).
                </p>
              </div>

              {/* Store 2: DataStax Astra DB */}
              <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-slate-100">
                      2. DataStax Astra DB (Direct Document Links Store)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
                    rera_links
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Retrieves official government PDFs, sanction plans, commencement certificates (CC), and occupancy certificates (OC) from collection <code className="text-sky-300">rera_links</code>.
                </p>
              </div>

              {/* Store 3: Supabase PostgreSQL */}
              <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-100">
                      3. Supabase PostgreSQL (Text-to-SQL Relational Engine)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                    execute_sql RPC
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Executes agentic SQL queries via tool <code className="text-blue-300">query_krera_sql_database</code> for global statistical aggregations and rankings across 9,800+ projects and 69,000+ complaints.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://rera.karnataka.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium"
              >
                <span>Official K-RERA Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setShowArchitectureInfo(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
