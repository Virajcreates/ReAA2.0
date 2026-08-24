'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import { ReraNamespace } from '@/types/rera';

interface ChatInputProps {
  onSendMessage: (message: string, namespaces?: ReraNamespace[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  isSubmitting?: boolean;
  statusText?: string;
}

export function ChatInput({
  onSendMessage,
  onStop,
  isStreaming,
  isSubmitting = false,
  statusText,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isBusy = isStreaming || isSubmitting;

  // Quick suggestion chips
  const quickTags = [
    { label: 'Top 5 Districts by Projects', prompt: 'What are the top 5 districts with the highest number of registered K-RERA projects?' },
    { label: 'Section 18 Delay Interest', prompt: 'What is the compensation and delay interest under Section 18 of RERA Act?' },
    { label: 'Form M vs Form N', prompt: 'Explain the difference between Form M and Form N before K-RERA.' },
    { label: '70% Escrow Account Rules', prompt: 'What are the rules regarding the 70% separate escrow account under Section 4(2)(l)(D)?' },
    { label: 'Prestige Park Grove Status', prompt: 'Tell me about Prestige Park Grove project registration, developer, and completion date.' },
  ];

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isBusy) return;
    const textToSend = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(textToSend);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      {/* Quick Suggestions Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1.5 no-scrollbar">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Quick Inquiries:</span>
        </span>
        {quickTags.map((tag, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(tag.prompt)}
            disabled={isBusy}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 dark:border-slate-800 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Input Card Container */}
      <div className="relative rounded-2xl bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 dark:border-slate-800 shadow-xl shadow-black/40 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/60 transition-all duration-200">
        {/* Status Indicator Pill if actively streaming */}
        {isStreaming && statusText && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-950/60 border-b border-indigo-900/40 rounded-t-2xl text-[11px] text-indigo-300 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span className="font-medium truncate">{statusText}</span>
          </div>
        )}

        <div className="flex items-end gap-2 p-2 sm:p-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={isBusy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isBusy
                ? 'Consulting K-RERA databases and generating response...'
                : 'Ask anything about K-RERA sections, delay compensation, project approvals, or statistics...'
            }
            className="flex-1 max-h-44 min-h-[42px] py-2 px-2.5 bg-transparent text-sm md:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed disabled:opacity-60"
          />

          {/* Action Button: Send / Stop */}
          <div className="flex items-center pb-0.5">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 sm:p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-md shadow-red-500/30 cursor-pointer"
                title="Stop response generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || isBusy}
                className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white transition-all duration-200 shadow-glow disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                title="Send inquiry"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-2">
        ReAA 2.0 synthesizes the RERA Act 2016 and K-RERA public disclosures. Output is for research purposes and does not constitute formal legal counsel.
      </p>
    </div>
  );
}
