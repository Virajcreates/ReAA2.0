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
        return <Scale className="w-5 h-5 text-neutral-800" />;
      case 'rera-litigation':
        return <Gavel className="w-5 h-5 text-neutral-800" />;
      case 'rera-complaints':
        return <FileText className="w-5 h-5 text-neutral-800" />;
      case 'rera-projects':
        return <Building2 className="w-5 h-5 text-neutral-800" />;
      case 'rera-links':
        return <Link className="w-5 h-5 text-neutral-800" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-neutral-800" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-neutral-200 border border-neutral-400 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-400 bg-neutral-300/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-300 border border-neutral-400 text-neutral-900">
              {getNamespaceIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border border-neutral-400 bg-neutral-300 text-neutral-800"
                >
                  {citation.namespace.toUpperCase()}
                </span>
                <span className="text-xs text-neutral-500 font-mono">
                  Match Score: {(citation.score * 100).toFixed(1)}%
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-neutral-900 leading-snug">
                {citation.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-300 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 font-sans">
          {citation.section && (
            <div className="p-3 bg-neutral-300/70 rounded-xl border border-neutral-400">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                Statutory Reference / Section
              </span>
              <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                {citation.section}
              </p>
            </div>
          )}

          {citation.citationRef && (
            <div className="p-3 bg-neutral-300/70 rounded-xl border border-neutral-400">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                Official Law Citation / Case Law
              </span>
              <p className="text-sm font-medium text-neutral-800 mt-0.5">
                {citation.citationRef}
              </p>
            </div>
          )}

          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 block mb-2">
              Retrieved Statutory / Ruling Context
            </span>
            <div className="p-4 bg-neutral-300/70 rounded-xl border border-neutral-400 text-sm leading-relaxed text-neutral-800 font-sans">
              {citation.snippet}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-400 bg-neutral-300/80">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
            <ShieldCheck className="w-4 h-4 text-neutral-700" />
            <span>Retrieved from K-RERA Knowledge Base</span>
          </div>

          <div className="flex items-center gap-3">
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-900 hover:text-neutral-950 underline decoration-neutral-500/60 hover:decoration-neutral-900 underline-offset-4 transition-colors"
              >
                <span>View Official Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-900 text-neutral-50 font-semibold rounded-full border border-neutral-700 px-4 py-1.5 text-xs transition-colors cursor-pointer shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
