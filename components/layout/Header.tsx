'use client';

import React, { useState } from 'react';
import {
  Scale,
  Menu,
  Plus,
  Sparkles,
  Database,
  Info,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Server,
  FileCode2,
} from 'lucide-react';
import { RERA_NAMESPACES, ReraNamespace } from '@/types/rera';
import { getNamespaceBadgeClasses } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewConsultation: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onToggleSidebar, onNewConsultation, isSidebarOpen }: HeaderProps) {
  const [showArchitectureInfo, setShowArchitectureInfo] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 md:h-16 px-3.5 md:px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/80 transition-colors">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border border-zinc-700 dark:border-zinc-300 flex items-center justify-center shadow-sm">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
                  ReAA 2.0
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-mono">
                  K-RERA
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 hover:bg-zinc-200/80 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium transition-all cursor-pointer shadow-2xs"
            title="View Tri-Database Architecture (Pinecone + Astra DB + Supabase)"
          >
            <Database className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden md:inline">Tri-Database Router</span>
            <span className="md:hidden text-[11px]">Architecture</span>
            <Info className="w-3 h-3 text-zinc-400 hidden sm:inline" />
          </button>

          {/* Model Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/10 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Gemini Flash</span>
          </div>

          {/* New Consultation CTA */}
          <button
            onClick={onNewConsultation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white text-xs font-semibold shadow-sm shadow-black/20 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Consultation</span>
          </button>
        </div>
      </header>

      {/* Tri-Database Architecture Modal */}
      {showArchitectureInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowArchitectureInfo(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Tri-Database Hybrid RAG Topology
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Gemini Agentic Router distributes queries across 3 specialized storage engines
                  </p>
                </div>
              </div>
            </div>

            {/* Tri-Database Breakdown */}
            <div className="space-y-3">
              {/* Store 1: Pinecone */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      1. Pinecone Vector DB (Dense Semantic Legal Corpus)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                    3,072 Dims
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Hosts namespaces <code className="text-blue-600 dark:text-blue-400">rera-legal</code>, <code className="text-blue-600 dark:text-blue-400">rera-litigation</code>, <code className="text-blue-600 dark:text-blue-400">rera-complaints</code>, and <code className="text-blue-600 dark:text-blue-400">rera-projects</code> with dynamic top-K retrieval (up to 12 vectors for legal circulars).
                </p>
              </div>

              {/* Store 2: DataStax Astra DB */}
              <div className="p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-800/60 bg-cyan-50/40 dark:bg-cyan-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      2. DataStax Astra DB (Direct Document Links Store)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-semibold">
                    rera_links
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Retrieves official government PDFs, sanction plans, commencement certificates (CC), and occupancy certificates (OC) from collection <code className="text-cyan-600 dark:text-cyan-400">rera_links</code>.
                </p>
              </div>

              {/* Store 3: Supabase PostgreSQL */}
              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      3. Supabase PostgreSQL (Text-to-SQL Relational Engine)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                    execute_sql RPC
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Executes agentic SQL queries via tool <code className="text-indigo-600 dark:text-indigo-400">query_krera_sql_database</code> for global statistical aggregations and rankings across 9,800+ projects and 69,000+ complaints.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://rera.karnataka.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:underline font-medium"
              >
                <span>Official K-RERA Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setShowArchitectureInfo(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-white transition-colors cursor-pointer"
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
