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
} from 'lucide-react';
import { RERA_NAMESPACES, ReraNamespace } from '@/types/rera';
import { getNamespaceBadgeClasses } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewConsultation: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onToggleSidebar, onNewConsultation, isSidebarOpen }: HeaderProps) {
  const [showRAGInfo, setShowRAGInfo] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-500/40">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm md:text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
                  K-RERA Advisory AI
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  Karnataka
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Real Estate Regulatory Authority Legal Assistant
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: RAG status & New consultation */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* RAG Namespaces Pill Indicator */}
          <button
            onClick={() => setShowRAGInfo(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 text-xs font-medium transition-colors"
            title="View Pinecone RAG Namespaces"
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Pinecone 4-Namespace RAG</span>
            <span className="md:hidden">RAG</span>
            <Info className="w-3 h-3 text-zinc-400" />
          </button>

          {/* Model Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Gemini 2.5 Flash</span>
          </div>

          {/* New Consultation CTA */}
          <button
            onClick={onNewConsultation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all duration-200 hover:shadow-emerald-600/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Consultation</span>
          </button>
        </div>
      </header>

      {/* RAG Info Modal */}
      {showRAGInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowRAGInfo(false)}
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Pinecone Vector Database Architecture
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Intelligent query routing across 4 segregated legal namespaces
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {(Object.keys(RERA_NAMESPACES) as ReraNamespace[]).map((nsKey) => {
                const info = RERA_NAMESPACES[nsKey];
                const badge = getNamespaceBadgeClasses(nsKey);
                return (
                  <div
                    key={nsKey}
                    className={`p-3 rounded-xl border ${badge.bg} ${badge.border} flex items-start gap-3`}
                  >
                    <div className={`mt-0.5 p-1 rounded-md bg-white dark:bg-zinc-800 border ${badge.border}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${badge.text}`} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {info.label}
                        </span>
                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${badge.border} ${badge.text}`}>
                          {info.id}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {info.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://rera.karnataka.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                <span>Official K-RERA Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setShowRAGInfo(false)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-white transition-colors"
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
