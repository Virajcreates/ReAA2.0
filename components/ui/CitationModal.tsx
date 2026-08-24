'use client';

import React from 'react';
import { CitationItem } from '@/types/rera';
import { getNamespaceBadgeClasses } from '@/lib/utils';
import { X, ExternalLink, ShieldCheck, Scale, Building2, Gavel, FileText, Link } from 'lucide-react';

interface CitationModalProps {
  citation: CitationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CitationModal({ citation, isOpen, onClose }: CitationModalProps) {
  if (!isOpen || !citation) return null;

  const badgeStyle = getNamespaceBadgeClasses(citation.namespace);

  const getNamespaceIcon = () => {
    switch (citation.namespace) {
      case 'rera-legal':
        return <Scale className="w-5 h-5 text-blue-500" />;
      case 'rera-litigation':
        return <Gavel className="w-5 h-5 text-purple-500" />;
      case 'rera-complaints':
        return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'rera-projects':
        return <Building2 className="w-5 h-5 text-amber-500" />;
      case 'rera-links':
        return <Link className="w-5 h-5 text-cyan-500" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-zinc-500" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              {getNamespaceIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                >
                  {citation.namespace.toUpperCase()}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Match Score: {(citation.score * 100).toFixed(1)}%
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {citation.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {citation.section && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Statutory Reference / Section
              </span>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {citation.section}
              </p>
            </div>
          )}

          {citation.citationRef && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Official Law Citation / Case Law
              </span>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                {citation.citationRef}
              </p>
            </div>
          )}

          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
              Retrieved Statutory / Ruling Context
            </span>
            <div className="p-4 bg-zinc-50/80 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 font-sans">
              {citation.snippet}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Retrieved from K-RERA Knowledge Base</span>
          </div>

          <div className="flex items-center gap-3">
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-blue-500 dark:text-blue-400 hover:underline"
              >
                <span>View Official Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
