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
    { label: 'Prestige Park Grove Details', prompt: 'Tell me about Prestige Park Grove project registration, developer, and completion date.' },
    { label: 'Section 18 Delay Interest', prompt: 'What is the compensation and delay interest under Section 18 of RERA Act?' },
    { label: 'Form M vs Form N', prompt: 'Explain the difference between Form M and Form N before K-RERA.' },
    { label: '70% Escrow Account', prompt: 'What are the rules regarding the 70% separate escrow account under Section 4(2)(l)(D)?' },
    { label: '5-Yr Structural Defect', prompt: 'What is the builder defect liability period under Section 14(3)?' },
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
    const textToSend = input;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(textToSend);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 md:pb-6">
      {/* Quick Suggestions Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <span>Quick Topics:</span>
        </span>
        {quickTags.map((tag, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(tag.prompt)}
            disabled={isBusy}
            className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-zinc-200 dark:border-zinc-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Input Box Card */}
      <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-200/50 dark:shadow-black/40 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition-all">
        {/* Status indicator bar if streaming */}
        {isStreaming && statusText && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50/70 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 rounded-t-2xl text-xs text-emerald-700 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium truncate">{statusText}</span>
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={isBusy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isBusy
                ? 'K-RERA Advisory AI is generating response...'
                : 'Ask anything about Karnataka RERA, legal sections, delay interest, project registrations, or tribunal orders...'
            }
            className="flex-1 max-h-44 min-h-[44px] py-2.5 px-3 bg-transparent text-sm md:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed disabled:opacity-60"
          />

          {/* Action Button: Send or Stop */}
          <div className="flex items-center pb-1">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md shadow-red-500/20 cursor-pointer"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || isBusy}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 transition-all duration-200 shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Legal Advisory Note */}
      <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 mt-2">
        K-RERA Advisory AI synthesizes the RERA Act 2016 and Karnataka RERA Rules 2017. Not an official substitute for legal counsel.
      </p>
    </div>
  );
}
