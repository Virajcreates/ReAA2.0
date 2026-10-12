'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  Database,
  Clock,
  Scale,
  Building2,
  ShieldAlert,
  ExternalLink,
  FileCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function DisclaimerPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-neutral-300 text-neutral-900 font-sans selection:bg-neutral-800 selection:text-neutral-50">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 md:h-16 px-4 md:px-8 bg-neutral-200/90 backdrop-blur-xl border-b border-neutral-400 transition-colors">
        {/* Left Side: Brand & Section Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer"
            title="Return to REAA Home"
          >
            <span className="text-xl sm:text-2xl font-display font-black tracking-tight text-neutral-900 group-hover:text-neutral-950 transition-colors select-none">
              REAA
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-300 text-neutral-800 border border-neutral-400 font-mono">
              K-RERA
            </span>
          </Link>
          <span className="hidden sm:inline-block h-4 w-px bg-neutral-400" />
          <span className="hidden sm:inline-block text-xs font-mono text-neutral-600">
            Statutory Regulatory Disclosures
          </span>
        </div>

        {/* Right Side: Back to Consultation Button */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-400 bg-neutral-300 hover:bg-neutral-400/60 text-neutral-800 hover:text-neutral-950 font-medium text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-700" />
            <span>Back to Consultation</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Page Title & Scope Hero */}
        <div className="bg-neutral-200/80 border border-neutral-400 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 mb-8 backdrop-blur-sm shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-50 shadow-xs">
              <AlertCircle className="w-3 h-3 text-neutral-200" />
              STATUTORY COMPLIANCE NOTICE
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-neutral-300 text-neutral-800 border border-neutral-400">
              <Calendar className="w-3 h-3 text-neutral-600" />
              CUTOFF: AUGUST 2026
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-neutral-300 text-neutral-700 border border-neutral-400">
              CENTRAL ACT 16 OF 2016
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-neutral-950 tracking-tight leading-tight mb-3">
            Regulatory Disclaimer &amp; Terms of Public Records Synthesis
          </h1>

          <p className="text-sm sm:text-base text-neutral-700 leading-relaxed max-w-3xl font-sans">
            Official operational notice governing the use of the REAA advisory intelligence platform, the scope of synthesized K-RERA regulatory archives, temporal indexing limitations, and strict verification mandates for property transactions and civil adjudications.
          </p>

          <div className="mt-6 pt-5 border-t border-neutral-300/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-600">
            <div>
              <span className="font-semibold text-neutral-800">Effective Temporal Scope:</span> Public Filings Through August 2026
            </div>
            <div>
              <span className="font-semibold text-neutral-800">Jurisdiction:</span> Karnataka RERA &amp; Allied Planning Authorities
            </div>
          </div>
        </div>

        {/* Structured Legal Disclosure Sections */}
        <div className="space-y-6">
          {/* Section 1: Public Regulatory Data Source */}
          <section className="bg-neutral-200/60 border border-neutral-400/80 rounded-2xl p-6 sm:p-7 backdrop-blur-xs transition-all hover:border-neutral-500/90 shadow-2xs">
            <div className="flex items-start gap-3.5 mb-3.5">
              <div className="p-2 rounded-xl bg-neutral-300 border border-neutral-400 text-neutral-800 shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-semibold text-neutral-600 uppercase tracking-wider block">
                  Section 1
                </span>
                <h2 className="text-lg sm:text-xl font-display font-bold text-neutral-950">
                  Public Regulatory Data Source
                </h2>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-2.5 pl-0 sm:pl-11 font-sans">
              <p>
                REAA (Real Estate Advisory AI) functions exclusively as an automated regulatory research and data synthesis engine. All information, project disclosures, statutory filings, sanctioned layouts, development costs, orders, and document URLs presented within this application are extracted strictly from publicly accessible records deposited with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-800 pl-1">
                <li>
                  <span className="font-semibold">Karnataka Real Estate Regulatory Authority (K-RERA)</span> under Section 4 and Section 11 of the Real Estate (Regulation and Development) Act, 2016.
                </li>
                <li>
                  <span className="font-semibold">Allied Competent Planning Authorities</span>, including the Bangalore Development Authority (BDA), Bangalore International Airport Area Planning Authority (BIAPPA), and Bangalore Metropolitan Region Development Authority (BMRDA).
                </li>
              </ul>
              <p>
                REAA does not generate, alter, modify, or privately host statutory records; it translates and presents public regulatory disclosures deposited by registered promoters.
              </p>
            </div>
          </section>

          {/* Section 2: Temporal Snapshot Limitation (August 2026 Cutoff) */}
          <section className="bg-neutral-200/60 border border-neutral-400/80 rounded-2xl p-6 sm:p-7 backdrop-blur-xs transition-all hover:border-neutral-500/90 shadow-2xs">
            <div className="flex items-start gap-3.5 mb-3.5">
              <div className="p-2 rounded-xl bg-neutral-300 border border-neutral-400 text-neutral-800 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-semibold text-neutral-600 uppercase tracking-wider block">
                  Section 2
                </span>
                <h2 className="text-lg sm:text-xl font-display font-bold text-neutral-950">
                  Temporal Snapshot Limitation (August 2026 Cutoff)
                </h2>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-2.5 pl-0 sm:pl-11 font-sans">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-600/30 text-amber-950 text-xs sm:text-sm font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>CRITICAL TEMPORAL BOUNDARY:</strong> The indexed databases, vector embeddings, and relational tables represent regulatory snapshots captured up to and including <strong>August 2026</strong>.
                </span>
              </div>
              <p>
                Regulatory disclosures recorded, altered, or mandated subsequent to the August 2026 cutoff are not dynamically reflected in this system. Specifically:
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-800 pl-1">
                <li>Civil litigations, interim stays, or injunctions instituted in judicial courts after August 2026 are not captured.</li>
                <li>Subsequent promoter Quarterly Progress Reports (QPRs), project completion extensions, or encumbrance updates filed post-August 2026 are not indexed.</li>
                <li>Recent K-RERA tribunal decrees, appellate rulings (REAT), recovery warrants, or project registration revocation orders issued after this cutoff date must be independently inspected on the live government portal.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: No Advocate-Client Relationship & Not Formal Legal Advice */}
          <section className="bg-neutral-200/60 border border-neutral-400/80 rounded-2xl p-6 sm:p-7 backdrop-blur-xs transition-all hover:border-neutral-500/90 shadow-2xs">
            <div className="flex items-start gap-3.5 mb-3.5">
              <div className="p-2 rounded-xl bg-neutral-300 border border-neutral-400 text-neutral-800 shrink-0 mt-0.5">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-semibold text-neutral-600 uppercase tracking-wider block">
                  Section 3
                </span>
                <h2 className="text-lg sm:text-xl font-display font-bold text-neutral-950">
                  No Advocate-Client Relationship &amp; Not Formal Legal Advice
                </h2>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-2.5 pl-0 sm:pl-11 font-sans">
              <p>
                REAA is an automated regulatory research interface designed solely for educational, preliminary due diligence, and analytical synthesis. The generated responses:
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-800 pl-1">
                <li>
                  <span className="font-semibold">Do NOT constitute legal advice:</span> Synthesized guidance does not take the place of professional legal counsel, comprehensive title search reports, or chartered engineer assessments.
                </li>
                <li>
                  <span className="font-semibold">Do NOT establish an Advocate-Client Relationship:</span> Use of REAA, including prompt submission, file inspection, or generated legal citations, does not create an advocate-client relationship under the Advocates Act, 1961, nor does it create an attorney-client privilege or legal retainer.
                </li>
                <li>
                  <span className="font-semibold">Statutory Discretion:</span> Judicial tribunals, Adjudicating Officers, and civil courts exercise independent discretion in applying statutory provisions and may interpret rules differently from algorithmic summaries.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4: Mandatory Independent Physical Verification */}
          <section className="bg-neutral-200/60 border border-neutral-400/80 rounded-2xl p-6 sm:p-7 backdrop-blur-xs transition-all hover:border-neutral-500/90 shadow-2xs">
            <div className="flex items-start gap-3.5 mb-3.5">
              <div className="p-2 rounded-xl bg-neutral-300 border border-neutral-400 text-neutral-800 shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-semibold text-neutral-600 uppercase tracking-wider block">
                  Section 4
                </span>
                <h2 className="text-lg sm:text-xl font-display font-bold text-neutral-950">
                  Mandatory Independent Physical Verification
                </h2>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-2.5 pl-0 sm:pl-11 font-sans">
              <p>
                Prior to executing an Agreement for Sale, disbursing home loan tranches, executing conveyance deeds, or initiating formal litigation under Section 31 of RERA Act 2016, all users, prospective homebuyers, financial institutions, and promoters MUST conduct mandatory independent verification:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                <div className="p-3 rounded-xl bg-neutral-300/70 border border-neutral-400 flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-800 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sub-Registrar Inspection:</strong> Physical search of 30-year Encumbrance Certificates (EC) and registered Sale Deeds at the jurisdictional SRO.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-300/70 border border-neutral-400 flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-800 shrink-0 mt-0.5" />
                  <span>
                    <strong>Municipal Sanction Plans:</strong> Physical examination of original sanctioned layout drawings, structural drawings, and Khata certificates.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-300/70 border border-neutral-400 flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-800 shrink-0 mt-0.5" />
                  <span>
                    <strong>Statutory NOC Validation:</strong> Direct verification of Fire Force Department, Pollution Control Board (KSPCB), and Airport Authority (AAI) clearances.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-300/70 border border-neutral-400 flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-800 shrink-0 mt-0.5" />
                  <span>
                    <strong>Official K-RERA Portal:</strong> Cross-checking the project&apos;s live PRM registration number directly on the official authority web portal.
                  </span>
                </div>
              </div>
              <p>
                Verify all current details on the official government website at{' '}
                <a
                  href="https://rera.karnataka.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-neutral-900 underline underline-offset-2 hover:text-black inline-flex items-center gap-1 font-semibold"
                >
                  rera.karnataka.gov.in
                  <ExternalLink className="w-3 h-3" />
                </a>.
              </p>
            </div>
          </section>

          {/* Section 5: Limitation of Liability */}
          <section className="bg-neutral-200/60 border border-neutral-400/80 rounded-2xl p-6 sm:p-7 backdrop-blur-xs transition-all hover:border-neutral-500/90 shadow-2xs">
            <div className="flex items-start gap-3.5 mb-3.5">
              <div className="p-2 rounded-xl bg-neutral-300 border border-neutral-400 text-neutral-800 shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-semibold text-neutral-600 uppercase tracking-wider block">
                  Section 5
                </span>
                <h2 className="text-lg sm:text-xl font-display font-bold text-neutral-950">
                  Limitation of Liability
                </h2>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-2.5 pl-0 sm:pl-11 font-sans">
              <p>
                To the maximum extent permissible by law:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-neutral-800 pl-1">
                <li>
                  The creators, operators, hosting providers, and contributors of REAA shall not be held liable for any direct, indirect, incidental, punitive, special, or consequential financial damages, property acquisition losses, forfeiture of advance booking amounts, or legal costs arising out of reliance upon answers, generated SQL statistics, or document links delivered by this system.
                </li>
                <li>
                  Promoter document filings deposited with K-RERA are occasionally uploaded under non-standard filenames or incomplete indices. REAA provides best-effort algorithmic retrieval and disclaims all liability for omissions or miscategorized promoter uploads.
                </li>
                <li>
                  Users accept full responsibility for verifying all factual details, title deeds, and regulatory approvals with licensed legal advocates and certified municipal authorities before completing any financial transactions.
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Bottom Return Action */}
        <div className="mt-10 p-6 rounded-2xl bg-neutral-200/90 border border-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 font-display">
              Ready to continue your statutory consultation?
            </h3>
            <p className="text-xs text-neutral-600 font-sans">
              Return to the conversational advisor with grounded K-RERA regulatory analytics.
            </p>
          </div>
          <button
            onClick={handleBack}
            className="px-5 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-900 text-neutral-50 font-semibold text-xs transition-colors cursor-pointer active:scale-95 shadow-sm shrink-0"
          >
            ← Return to Consultation
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-neutral-400 bg-neutral-200/60 text-center text-xs text-neutral-600 font-mono">
        <p>
          REAA • Karnataka Real Estate Regulatory Authority Intelligence System • Official Records Indexed Through August 2026
        </p>
      </footer>
    </div>
  );
}
