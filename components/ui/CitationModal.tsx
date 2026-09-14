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
        return <Scale className="w-5 h-5 text-white" />;
      case 'rera-litigation':
        return <Gavel className="w-5 h-5 text-white" />;
      case 'rera-complaints':
        return <FileText className="w-5 h-5 text-white" />;
      case 'rera-projects':
        return <Building2 className="w-5 h-5 text-white" />;
      case 'rera-links':
        return <Link className="w-5 h-5 text-white" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-black border border-white/12 rounded-2xl overflow-hidden backdrop-blur-xl shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
              {getNamespaceIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border border-white/20 bg-white/10 text-white"
                >
                  {citation.namespace.toUpperCase()}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Match Score: {(citation.score * 100).toFixed(1)}%
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-white leading-snug">
                {citation.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 font-sans">
          {citation.section && (
            <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Statutory Reference / Section
              </span>
              <p className="text-sm font-semibold text-white mt-0.5">
                {citation.section}
              </p>
            </div>
          )}

          {citation.citationRef && (
            <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Official Law Citation / Case Law
              </span>
              <p className="text-sm font-medium text-zinc-200 mt-0.5">
                {citation.citationRef}
              </p>
            </div>
          )}

          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-2">
              Retrieved Statutory / Ruling Context
            </span>
            <div className="p-4 bg-black rounded-xl border border-white/10 text-sm leading-relaxed text-zinc-200 font-sans">
              {citation.snippet}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>Retrieved from K-RERA Knowledge Base</span>
          </div>

          <div className="flex items-center gap-3">
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 underline decoration-blue-400/40 hover:decoration-blue-300 underline-offset-4 transition-colors"
              >
                <span>View Official Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="bg-white text-black font-semibold rounded-full hover:bg-zinc-200 px-4 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
