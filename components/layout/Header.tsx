'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Plus,
  Share2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewConsultation: () => void;
  isSidebarOpen: boolean;
  activeConversationId?: string | null;
  hasMessages?: boolean;
}

export const Header = React.memo(function Header({
  onToggleSidebar,
  onNewConsultation,
  isSidebarOpen,
  activeConversationId,
  hasMessages = false,
}: HeaderProps) {
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    if (!activeConversationId) return;
    const shareUrl = `${window.location.origin}/share/${activeConversationId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 md:h-16 px-3.5 md:px-6 bg-neutral-200/90 backdrop-blur-xl border-b border-neutral-400 transition-colors">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300 transition-colors cursor-pointer"
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl font-display font-black tracking-tight text-neutral-900 select-none">
              REAA
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-300 text-neutral-800 border border-neutral-400 font-mono">
                  K-RERA
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-600 hidden sm:block font-sans">
                Hybrid Agentic Vector & SQL Advisory
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Disclaimer, Share Consultation & New Consultation */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Regulatory Disclaimer Icon Button */}
          <Link
            href="/disclaimer"
            className="flex items-center justify-center p-1.5 sm:p-2 rounded-full border border-neutral-400 bg-neutral-300 hover:bg-neutral-400/60 text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer"
            title="Regulatory Disclaimer & Terms (Data through August 2026)"
            aria-label="Regulatory Disclaimer & Terms (Data through August 2026)"
          >
            <AlertCircle className="w-4 h-4 text-neutral-700" />
          </Link>

          {/* Share Consultation Button */}
          {activeConversationId && hasMessages && (
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                shareCopied
                  ? 'bg-neutral-400/50 border-neutral-500 text-neutral-900'
                  : 'bg-neutral-300 hover:bg-neutral-400/60 border-neutral-400 text-neutral-800 hover:text-neutral-950'
              }`}
              title="Copy public consultation share link"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-neutral-800" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          )}

          {/* New Consultation CTA */}
          <button
            onClick={onNewConsultation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-900 text-neutral-50 font-semibold text-xs transition-colors cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Consultation</span>
          </button>
        </div>
      </header>
    </>
  );
});
