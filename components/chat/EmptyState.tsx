'use client';

import React from 'react';
import {
  Landmark,
  Home,
  TrendingUp,
  Compass,
  Scale,
  PieChart,
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  const promptCategories = [
    {
      id: 'banking',
      title: 'Banking',
      subtitle: 'Mortgage Underwriters & Retail Loan Officers',
      icon: Landmark,
      prompts: [
        'What is the verified K-RERA registration number and designated 70% statutory escrow bank account (bank name, branch, IFSC) registered for [Project Name]?',
        'Are there any recorded land title litigations, court injunctions, or encumbrances against the survey numbers of this project before we approve APF status?',
      ],
    },
    {
      id: 'home-buyers',
      title: 'Home Buyers',
      subtitle: 'Verified Project & Delivery Due Diligence',
      icon: Home,
      prompts: [
        'What is the legally committed possession date registered under RERA for [Project Name], and has the developer taken any extensions?',
        'How many total complaints have been filed against this specific project versus the developer\'s entire corporate portfolio?',
        'If my flat handover is delayed by 14 months, what is the exact monthly interest calculation I am entitled to claim under Section 18?',
      ],
    },
    {
      id: 'property-investors',
      title: 'Property Investors',
      subtitle: 'Risk Profiling & Execution Velocity',
      icon: TrendingUp,
      prompts: [
        'What is the historical delivery track record and average delay duration of [Promoter Name] across their residential developments in Bengaluru?',
        'What is the total number of sanctioned units versus unsold inventory currently declared in the developer\'s latest quarterly statutory filing?',
      ],
    },
    {
      id: 'consultants',
      title: 'Real Estate Consultants',
      subtitle: 'Sanctions, Clearances & Area Disclosures',
      icon: Compass,
      prompts: [
        'What are the exact sanctioned building parameters—total towers, floor height, and approved unit layouts—registered with the authority?',
        'Which statutory clearances (AAI/HAL Height NOC, KSPCB CFE/CFO, Fire Safety) have been uploaded and verified for this development?',
      ],
    },
    {
      id: 'legal',
      title: 'Legal Professionals',
      subtitle: 'Civil Litigations & Forum Jurisdiction',
      icon: Scale,
      prompts: [
        'What are the exact Original Suit (O.S.) numbers, court locations, and plaintiffs recorded in the land litigation registry for [Project Name]?',
        'Under Newtech Promoters v. State of UP, which forum holds exclusive jurisdiction for Section 18 refund vs Section 71 compensation?',
      ],
    },
    {
      id: 'financial',
      title: 'Financial Institutions',
      subtitle: 'Private Equity, NBFCs & Project Risk',
      icon: PieChart,
      prompts: [
        'What is the total estimated project cost versus actual audited construction expenditure logged in the Form 3 (CA) and Form 2 (Engineer) filings?',
        'What is the total aggregate litigation and complaint liability across the promoter\'s group holding companies and subsidiary SPVs?',
      ],
    },
    {
      id: 'government',
      title: 'Government Organizations',
      subtitle: 'Compliance Monitoring & Enforcement',
      icon: ShieldCheck,
      prompts: [
        'Which registered projects in [District Name] have crossed their effective completion date without submitting extension or completion filings?',
        'Generate a list of developers with more than five unsatisfied Revenue Recovery Certificates (RRCs) pending enforcement under Section 40.',
      ],
    },
    {
      id: 'layman',
      title: 'Layman',
      subtitle: 'General Public & First-Time Buyers',
      icon: Users,
      prompts: [
        'Is [Project Name] legally approved and safe for me to buy a flat in, or are there hidden problems with the land?',
        'The builder is asking for a 20% advance payment before giving me a written agreement—is that allowed by the rules?',
        'What does it mean if a project\'s status shows up as \'Rejected\' or \'Under Investigation\' on the official website?',
      ],
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 md:py-6 flex flex-col items-center justify-center space-y-6 md:space-y-8 animate-fade-in">
      {/* Hero Badge & Title */}
      <div className="text-center space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-200 border border-neutral-400 text-neutral-800 text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5 text-neutral-800" />
          <span>REAA • Authoritative Karnataka RERA Advisory</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-neutral-900 tracking-tight leading-tight">
          Authoritative Legal Advisory for{' '}
          <span className="text-neutral-900 underline decoration-neutral-500/60 underline-offset-8">
            Karnataka Real Estate
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xl mx-auto font-sans">
          Domain-specialized AI agent providing statutory analysis, tribunal precedents, and empirical project due diligence across 9,800+ K-RERA projects.
        </p>
      </div>

      {/* 8 Persona Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full">
        {promptCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="p-4 sm:p-5 rounded-2xl border border-neutral-400 bg-neutral-200 hover:border-neutral-500 shadow-sm transition-all duration-200 space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-neutral-300 border border-neutral-400 text-neutral-900 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-display font-bold text-neutral-900">
                    {cat.title}
                  </h2>
                  <p className="text-[11px] text-neutral-600 font-sans">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              {/* Sample Prompts */}
              <div className="space-y-1.5 pt-0.5">
                {cat.prompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectPrompt(prompt)}
                    className="w-full text-left p-2.5 rounded-xl text-xs text-neutral-800 hover:text-neutral-950 bg-neutral-300/70 hover:bg-neutral-300 border border-neutral-400 hover:border-neutral-500 transition-all flex items-center justify-between group cursor-pointer font-sans"
                  >
                    <span className="line-clamp-3 leading-relaxed pr-2">{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-neutral-900 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Enterprise Advisory Banner */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] font-mono text-neutral-600 pt-2 pb-4">
        <div className="flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-neutral-800" />
          <span>Real Estate (Regulation & Development) Act 2016</span>
        </div>
        <span className="hidden sm:inline text-neutral-400">•</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-800" />
          <span>Strict Verbatim Grounding</span>
        </div>
        <span className="hidden sm:inline text-neutral-400">•</span>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-neutral-800" />
          <span>Karnataka RERA Jurisdiction</span>
        </div>
      </div>
    </div>
  );
}
