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
        className={`group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 hover:shadow-sm hover:scale-[1.02] cursor-pointer text-left ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
        title="Click to view retrieved statutory citation and ruling context"
      >
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/70 dark:bg-black/30 font-mono text-[10px] font-bold">
          {index + 1}
        </span>

        <span className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          {getNamespaceIcon()}
        </span>

        <span className="max-w-[200px] truncate font-medium">
          {citation.section || citation.title}
        </span>

        <span className="text-[10px] opacity-70 font-mono">
          {(citation.score * 100).toFixed(0)}%
        </span>

        <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </button>

      <CitationModal
        citation={citation}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
