'use client';

import React, { useState } from 'react';
import { CitationItem } from '@/types/rera';
import { getNamespaceBadgeClasses } from '@/lib/utils';
import { CitationModal } from '@/components/ui/CitationModal';
import { Scale, Gavel, FileText, Building2, ChevronRight } from 'lucide-react';

interface CitationPillProps {
  citation: CitationItem;
  index: number;
}

export function CitationPill({ citation, index }: CitationPillProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const badgeStyle = getNamespaceBadgeClasses(citation.namespace);

  const getNamespaceIcon = () => {
    switch (citation.namespace) {
      case 'rera-legal':
        return <Scale className="w-3.5 h-3.5" />;
      case 'rera-litigation':
        return <Gavel className="w-3.5 h-3.5" />;
      case 'rera-complaints':
        return <FileText className="w-3.5 h-3.5" />;
      case 'rera-projects':
        return <Building2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer text-left font-sans"
        title="Click to view retrieved statutory citation and ruling context"
      >
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-black font-mono text-[10px] font-bold">
          {index + 1}
        </span>

        <span className="flex items-center gap-1 text-white">
          {getNamespaceIcon()}
        </span>

        <span className="max-w-[200px] truncate font-medium text-white">
          {citation.section || citation.title}
        </span>

        <span className="text-[10px] text-zinc-400 font-mono">
          {(citation.score * 100).toFixed(0)}%
        </span>

        <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </button>

      <CitationModal
        citation={citation}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
