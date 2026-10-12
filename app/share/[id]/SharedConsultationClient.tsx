'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageItem } from '@/components/chat/MessageItem';
import { Message } from '@/types/chat';
import { forkConsultation } from '@/app/actions/fork-consultation';
import {
  Share2,
  Check,
  Plus,
  Lock,
  Calendar,
  AlertCircle,
  Loader2,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export interface SharedConsultationData {
  id: string;
  title: string;
  createdAt: number;
  activeNamespaces?: string[];
  messages: Message[];
}

interface SharedConsultationClientProps {
  id: string;
  initialConsultation: SharedConsultationData | null;
}

export function SharedConsultationClient({
  id,
  initialConsultation,
}: SharedConsultationClientProps) {
  const router = useRouter();
  const [consultation, setConsultation] = useState<SharedConsultationData | null>(
    initialConsultation
  );
  const [loading, setLoading] = useState(!initialConsultation);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have initial data from server, no need for local cache lookup
    if (initialConsultation) {
      setConsultation(initialConsultation);
      setLoading(false);
      return;
    }

    // Client-side fallback: check local cache in browser localStorage
    try {
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('krera_chat_sessions_v1')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const sessions = JSON.parse(raw);
              if (Array.isArray(sessions)) {
                const match = sessions.find((s: any) => s.id === id);
                if (match) {
                  setConsultation({
                    id: match.id,
                    title: match.title || 'Consultation Archive',
                    createdAt: match.createdAt || Date.now(),
                    activeNamespaces: match.activeNamespaces,
                    messages: match.messages || [],
                  });
                  setLoading(false);
                  return;
                }
              }
            }
          }
        }
      }
    } catch (localErr) {
      console.warn('Failed reading localStorage for shared session:', localErr);
    }

    setError('This consultation could not be found or is no longer available.');
    setLoading(false);
  }, [id, initialConsultation]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleForkConsultation = async () => {
    if (isForking || !id) return;
    setIsForking(true);
    setForkError(null);

    try {
      const result = await forkConsultation(id, {
        title: consultation?.title,
        activeNamespaces: consultation?.activeNamespaces,
        messages: consultation?.messages,
      });

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      if (!result.success || !result.newConsultationId) {
        setForkError(result.error || 'Failed to clone consultation.');
        setIsForking(false);
        return;
      }

      // Optimistically update localStorage with cloned consultation for instant display on /
      if (result.clonedConsultation && typeof window !== 'undefined') {
        try {
          const baseKey = 'krera_chat_sessions_v1';
          let foundTargetKey = false;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(baseKey)) {
              foundTargetKey = true;
              const raw = localStorage.getItem(key);
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  localStorage.setItem(
                    key,
                    JSON.stringify([
                      result.clonedConsultation,
                      ...list.filter((c: any) => c.id !== result.newConsultationId),
                    ])
                  );
                }
              }
            }
          }

          if (!foundTargetKey) {
            localStorage.setItem(baseKey, JSON.stringify([result.clonedConsultation]));
          }

          localStorage.setItem('krera_active_conv_id', result.newConsultationId);
        } catch (storageErr) {
          console.warn('Failed to optimistically cache forked consultation:', storageErr);
        }
      }

      // Navigate into the newly cloned consultation
      router.push(`/?id=${encodeURIComponent(result.newConsultationId)}`);
    } catch (err: any) {
      console.error('Error forking consultation:', err);
      setForkError(err?.message || 'Failed to clone consultation.');
      setIsForking(false);
    }
  };

  const formattedDate = consultation?.createdAt
    ? new Date(consultation.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="flex flex-col min-h-screen w-full bg-neutral-300 text-neutral-900 font-sans selection:bg-neutral-800 selection:text-neutral-50">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 md:h-16 px-4 md:px-6 bg-neutral-200/90 backdrop-blur-xl border-b border-neutral-400 transition-colors">
        {/* Left Side: Brand */}
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
          <span className="hidden md:inline-block h-4 w-px bg-neutral-400" />
          <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-500">
            <Lock className="w-3.5 h-3.5 text-neutral-500" />
            <span>Read-Only Consultation Archive</span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Copy Link CTA */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
              linkCopied
                ? 'bg-neutral-300 border-neutral-400 text-neutral-900'
                : 'bg-neutral-200 hover:bg-neutral-300 border-neutral-400 text-neutral-800 hover:text-neutral-950'
            }`}
            title="Copy consultation URL to clipboard"
          >
            {linkCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-neutral-900" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-neutral-600" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>

          {/* Continue / Fork Consultation CTA */}
          <button
            onClick={handleForkConsultation}
            disabled={isForking}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-900 disabled:bg-neutral-700/50 text-neutral-50 font-semibold text-xs transition-colors cursor-pointer active:scale-95 shadow-sm disabled:cursor-not-allowed"
            title="Clone this consultation to continue chatting"
          >
            {isForking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Cloning...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Continue in Private Chat</span>
                <span className="sm:hidden">Continue</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col justify-start">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-neutral-600 animate-fade-in">
            <Loader2 className="w-7 h-7 text-neutral-800 animate-spin" />
            <p className="text-sm font-medium">Loading consultation archive...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-neutral-200 border border-neutral-400 flex items-center justify-center mb-4 text-neutral-600">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 font-display mb-1.5">
              Consultation Not Found
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mb-6 leading-relaxed">
              {error}
            </p>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-900 text-neutral-50 text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Consultation</span>
            </Link>
          </div>
        )}

        {!loading && consultation && (
          <div className="flex-1 w-full flex flex-col">
            {/* Consultation Banner Info */}
            <div className="w-full border-b border-neutral-400 bg-neutral-200/80 py-6 px-4 md:px-6">
              <div className="max-w-4xl mx-auto space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-600">
                  <span className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-neutral-300 border border-neutral-400 text-neutral-800">
                    <Lock className="w-3 h-3 text-neutral-600" />
                    Read-Only
                  </span>
                  {formattedDate && (
                    <span suppressHydrationWarning className="flex items-center gap-1 text-neutral-600">
                      <Calendar className="w-3 h-3 text-neutral-600" />
                      <span suppressHydrationWarning>{formattedDate}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-neutral-600">
                    <MessageSquare className="w-3 h-3 text-neutral-600" />
                    {consultation.messages.length} message{consultation.messages.length === 1 ? '' : 's'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 tracking-tight">
                  {consultation.title}
                </h1>

                <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl">
                  Snapshot of a Karnataka Real Estate Regulatory Authority (K-RERA) legal advisory session. You can copy any table or citation directly, or click continue to fork this consultation into your account.
                </p>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 w-full flex flex-col py-4">
              {consultation.messages.length === 0 ? (
                <div className="max-w-4xl mx-auto py-12 text-center text-neutral-600 text-sm">
                  This consultation does not contain any recorded messages.
                </div>
              ) : (
                consultation.messages.map((msg) => (
                  <MessageItem key={msg.id} message={msg} />
                ))
              )}
            </div>

            {/* Read-Only Bottom Notice Bar */}
            <div className="sticky bottom-0 z-20 w-full border-t border-neutral-400 bg-neutral-200/95 backdrop-blur-md py-3 px-4 md:px-6">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-neutral-800">
                  <Sparkles className="w-4 h-4 text-neutral-800 flex-shrink-0" />
                  <span className="hidden sm:inline">
                    Want to ask follow-up questions about this K-RERA advisory consultation?
                  </span>
                  <span className="sm:hidden">Continue this consultation?</span>
                </div>

                <div className="flex items-center gap-2">
                  {forkError && (
                    <span className="text-[11px] text-rose-500 hidden sm:inline">
                      {forkError}
                    </span>
                  )}
                  <button
                    onClick={handleForkConsultation}
                    disabled={isForking}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-900 disabled:bg-neutral-700/50 text-neutral-50 font-semibold text-xs transition-colors cursor-pointer flex-shrink-0 shadow-sm disabled:cursor-not-allowed"
                  >
                    {isForking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Cloning Consultation...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Your Consultation</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
