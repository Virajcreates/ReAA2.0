'use client';

import React from 'react';
import { Scale, Gavel, FileText, Building2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { ReraNamespace } from '@/types/rera';

interface EmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  const promptCategories = [
    {
      namespace: 'rera-legal' as ReraNamespace,
      title: 'Statutory Act & Rules',
      subtitle: 'RERA Act 2016 & Karnataka Rules 2017',
      icon: Scale,
      color: 'border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-500/50',
      iconColor: 'text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40',
      badgeText: 'rera-legal',
      badgeClass: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      prompts: [
        'What are the builder obligations for structural defects under Section 14(3)?',
        'Explain the 70% separate escrow account rule under Section 4(2)(l)(D).',
        'Can a promoter accept more than 10% booking advance without registering an Agreement for Sale?',
      ],
    },
    {
      namespace: 'rera-litigation' as ReraNamespace,
      title: 'Tribunal & Court Rulings',
      subtitle: 'Supreme Court & High Court Precedents',
      icon: Gavel,
      color: 'border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-500/50',
      iconColor: 'text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40',
      badgeText: 'rera-litigation',
      badgeClass: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      prompts: [
        'What did the Supreme Court rule in Newtech Promoters regarding ongoing projects and Form M refunds?',
        'Can a builder enforce one-sided delay compensation clauses according to Pioneer Urban v. Govindan Raghavan?',
        'What did Fortune Infrastructure v. Trevor D\'Lima rule on indefinite possession delays?',
      ],
    },
    {
      namespace: 'rera-complaints' as ReraNamespace,
      title: 'Complaints & Adjudication',
      subtitle: 'Form M / Form N & Interest Calculation',
      icon: FileText,
      color: 'border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500/50',
      iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40',
      badgeText: 'rera-complaints',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      prompts: [
        'How do I calculate delayed possession interest using SBI MCLR + 2% per annum under Karnataka Rule 18?',
        'What is the difference between filing Form M (Authority) and Form N (Adjudicating Officer)?',
        'How are K-RERA recovery warrants executed under Section 40 via the District Collector?',
      ],
    },
    {
      namespace: 'rera-projects' as ReraNamespace,
      title: 'Project Registrations & Disclosures',
      subtitle: 'PRM Verification & Promoter Duties',
      icon: Building2,
      color: 'border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500/50',
      iconColor: 'text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40',
      badgeText: 'rera-projects',
      badgeClass: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      prompts: [
        'How can a homebuyer verify a project registration number (PRM) and quarterly disclosures in Bangalore?',
        'When is a promoter required to execute a conveyance deed to the Association of Allottees under Section 17?',
        'What projects are exempt from mandatory K-RERA registration under Section 3?',
      ],
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center space-y-8 animate-fade-in">
      {/* Hero Badge & Title */}
      <div className="text-center space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Karnataka Real Estate Regulatory Authority (K-RERA) Advisory AI</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
          Intelligent Legal Advisory for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600">Karnataka Real Estate</span>
        </h1>

        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Ground-truth legal guidance powered by multi-namespace Pinecone vector retrieval across the RERA Act 2016, Karnataka Rules 2017, Supreme Court precedents, and adjudication orders.
        </p>
      </div>

      {/* 4 Vector Store Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {promptCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.namespace}
              className={`p-5 rounded-2xl border transition-all duration-200 backdrop-blur-sm ${cat.color} space-y-3`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${cat.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {cat.title}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${cat.badgeClass}`}>
                  {cat.badgeText}
                </span>
              </div>

              {/* Sample Prompts */}
              <div className="space-y-1.5 pt-1">
                {cat.prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectPrompt(prompt)}
                    className="w-full text-left p-2.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-white/60 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-850 border border-zinc-200/50 dark:border-zinc-800/60 transition-all flex items-center justify-between group shadow-2xs hover:shadow-xs"
                  >
                    <span className="line-clamp-2 leading-relaxed pr-2">{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Grounding Banner */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Real-time Multi-Namespace Vector Retrieval</span>
        </div>
        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
        <div className="flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-blue-500" />
          <span>Statutory Citation Pill Badges</span>
        </div>
        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>Grounded in Google Gemini 2.5 Flash</span>
        </div>
      </div>
    </div>
  );
}
