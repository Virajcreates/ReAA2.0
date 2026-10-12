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
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-neutral-400 bg-neutral-300/80 hover:bg-neutral-300 text-neutral-800 hover:text-neutral-950 transition-all cursor-pointer text-left font-sans shadow-xs"
        title="Click to view retrieved statutory citation and ruling context"
      >
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-neutral-800 text-neutral-50 font-mono text-[10px] font-bold shadow-xs">
          {index + 1}
        </span>

        <span className="flex items-center gap-1 text-neutral-800">
          {getNamespaceIcon()}
        </span>

        <span className="max-w-[200px] truncate font-medium text-neutral-900 group-hover:text-neutral-950 transition-colors">
          {citation.section || citation.title}
        </span>

        <span className="text-[10px] text-neutral-600 font-mono">
          {(citation.score * 100).toFixed(0)}%
        </span>

        <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
      </button>

      <CitationModal
        citation={citation}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
