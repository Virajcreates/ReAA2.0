'use client';

import React from 'react';
import {
  Scale,
  Gavel,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Database,
  BarChart3,
} from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  const promptCategories = [
    {
      id: 'statutory',
      title: 'Statutory Act & Rules',
      subtitle: 'RERA Act 2016 & Karnataka Rules 2017',
      icon: Scale,
      badgeText: 'Pinecone: rera-legal',
      prompts: [
        'What are the builder obligations for structural defects under Section 14(3)?',
        'Explain the 70% separate escrow account rule under Section 4(2)(l)(D).',
        'Can a promoter accept more than 10% booking advance without an Agreement for Sale?',
      ],
    },
    {
      id: 'litigation',
      title: 'Tribunal & Court Rulings',
      subtitle: 'Supreme Court & High Court Precedents',
      icon: Gavel,
      badgeText: 'Pinecone: rera-litigation',
      prompts: [
        'What did the Supreme Court rule in Newtech Promoters regarding ongoing projects and Form M refunds?',
        'Can a builder enforce one-sided delay penalty clauses according to Pioneer Urban v. Govindan Raghavan?',
        'What did Fortune Infrastructure v. Trevor D\'Lima rule on indefinite possession delays?',
      ],
    },
    {
      id: 'complaints',
      title: 'Complaints & Adjudication',
      subtitle: 'Form M / Form N & Interest Calculation',
      icon: FileText,
      badgeText: 'Pinecone: rera-complaints',
      prompts: [
        'How do I calculate delayed possession interest using SBI MCLR + 2% per annum under Karnataka Rule 18?',
        'What is the procedural difference between filing Form M (Authority) and Form N (Adjudicating Officer)?',
        'How are K-RERA recovery warrants executed under Section 40 via the District Collector?',
      ],
    },
    {
      id: 'statistics',
      title: 'Statistical Queries & Documents',
      subtitle: 'PostgreSQL Text-to-SQL & Document Vector Store',
      icon: BarChart3,
      badgeText: 'Supabase SQL + Astra DB',
      prompts: [
        'What are the top 5 districts with the highest number of registered K-RERA projects?',
        'List the promoters with the highest number of registered ongoing projects in Bengaluru.',
        'Download document links and sanctioned plans for Prestige Park Grove.',
      ],
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10 flex flex-col items-center justify-center space-y-6 md:space-y-8 animate-fade-in">
      {/* Hero Badge & Title */}
      <div className="text-center space-y-3.5 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/15 text-zinc-300 text-xs font-mono font-medium backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>REAA • Tri-Database Hybrid Agentic RAG Engine</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-white tracking-tight leading-tight">
          Authoritative Legal Advisory for{' '}
          <span className="text-white underline decoration-white/25 underline-offset-8">
            Karnataka Real Estate
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto font-sans">
          REAA is a domain-specialized AI agent integrating dense Pinecone vector search, DataStax Astra DB document retrieval, and Supabase PostgreSQL Text-to-SQL across 9,800+ K-RERA projects.
        </p>
      </div>

      {/* 4 Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full">
        {promptCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-display font-bold text-white">
                      {cat.title}
                    </h2>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                <span className="text-[9px] sm:text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-zinc-300">
                  {cat.badgeText}
                </span>
              </div>

              {/* Sample Prompts */}
              <div className="space-y-1.5 pt-0.5">
                {cat.prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectPrompt(prompt)}
                    className="w-full text-left p-2.5 rounded-xl text-xs text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between group cursor-pointer font-sans"
                  >
                    <span className="line-clamp-2 leading-relaxed pr-2">{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-white flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Tri-Store Architecture Banner */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] font-mono text-zinc-500 pt-1">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-white" />
          <span>Pinecone + Astra DB + Supabase SQL</span>
        </div>
        <span className="hidden sm:inline text-white/20">•</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-white" />
          <span>Strict Verbatim Grounding</span>
        </div>
        <span className="hidden sm:inline text-white/20">•</span>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>Gemini Agentic Function Calling</span>
        </div>
      </div>
    </div>
  );
}
