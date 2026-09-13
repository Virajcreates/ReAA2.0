'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Square, Sparkles, Mic, MicOff, Languages } from 'lucide-react';
import { ReraNamespace } from '@/types/rera';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface ChatInputProps {
  onSendMessage: (message: string, namespaces?: ReraNamespace[], language?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  isSubmitting?: boolean;
  statusText?: string;
}

export const ChatInput = React.memo(function ChatInput({
  onSendMessage,
  onStop,
  isStreaming,
  isSubmitting = false,
  statusText,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const baseTextRef = useRef('');

  const isBusy = isStreaming || isSubmitting;

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechToText({
    continuous: true,
    interimResults: true,
    lang: selectedLang,
    onResult: (spokenText) => {
      const base = baseTextRef.current;
      if (!base.trim()) {
        setInput(spokenText);
      } else {
        const needsSpace = !base.endsWith(' ') && !spokenText.startsWith(' ');
        setInput(`${base}${needsSpace ? ' ' : ''}${spokenText}`);
      }
    },
  });

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      baseTextRef.current = input;
      startListening();
    }
  };

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
    if (isListening) {
      stopListening();
    }
    if (!input.trim() || isBusy) return;
    const textToSend = input.trim();
    setInput('');
    baseTextRef.current = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(textToSend, undefined, selectedLang);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      {/* Quick Suggestions Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1.5 no-scrollbar">
        <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-white" />
          <span>Quick Inquiries:</span>
        </span>
        {quickTags.map((tag, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(tag.prompt, undefined, selectedLang)}
            disabled={isBusy}
            className="text-[11px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans"
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Input Card Container */}
      <div className={`relative rounded-2xl bg-black/90 backdrop-blur-xl border transition-all duration-200 ${
        isListening
          ? 'border-red-500/80 ring-1 ring-red-500/50'
          : 'border-white/12 focus-within:border-white/30'
      }`}>
        {/* Status Indicator Pill if actively streaming */}
        {isStreaming && statusText && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border-b border-white/10 rounded-t-2xl text-[11px] text-white backdrop-blur-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="font-medium truncate">{statusText}</span>
          </div>
        )}

        {/* Active Voice Dictation Banner */}
        {isListening && (
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-red-950/40 border-b border-red-900/40 rounded-t-2xl text-[11px] text-red-300 backdrop-blur-xs animate-fade-in font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-medium">
                {selectedLang === 'kn-IN'
                  ? 'Listening in Kannada (ಕನ್ನಡ)... speak your query'
                  : selectedLang === 'hi-IN'
                  ? 'Listening in Hindi (हिन्दी)... speak your query'
                  : 'Listening in English... speak your query'}
              </span>
            </div>
            <button
              type="button"
              onClick={stopListening}
              className="text-[10px] uppercase font-semibold tracking-wider text-red-400 hover:text-red-200 transition-colors cursor-pointer"
            >
              Done Dictating
            </button>
          </div>
        )}

        {/* Speech Error Notice */}
        {speechError && (
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-amber-950/30 border-b border-amber-900/40 rounded-t-2xl text-[11px] text-amber-300 backdrop-blur-xs animate-fade-in font-mono">
            <span className="truncate">{speechError}</span>
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
                : isListening
                ? selectedLang === 'kn-IN'
                  ? 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ... (Listening in Kannada)'
                  : selectedLang === 'hi-IN'
                  ? 'हिन्दी में बोलिए... (Listening in Hindi)'
                  : 'Listening to speech input... speak now.'
                : selectedLang === 'kn-IN'
                ? 'K-RERA ಅಥವಾ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ...'
                : selectedLang === 'hi-IN'
                ? 'K-RERA या रियल एस्टेट के बारे में हिन्दी में पूछें...'
                : 'Ask anything about K-RERA sections, delay compensation, project approvals, or statistics...'
            }
            className="flex-1 max-h-44 min-h-[42px] py-2 px-2.5 bg-transparent text-sm md:text-base text-white placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed disabled:opacity-60 font-sans"
          />

          {/* Action Cluster: Language Selector + Voice Mic + Send / Stop */}
          <div className="flex items-center gap-1.5 sm:gap-2 pb-0.5 shrink-0">
            {/* Compact Language Selector Dropdown */}
            <div className="relative flex items-center">
              <Languages className="w-3.5 h-3.5 text-zinc-400 absolute left-2 pointer-events-none" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                disabled={isBusy}
                className="appearance-none pl-7 pr-2.5 py-1.5 sm:py-2 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 focus:outline-none focus:border-white/30 transition-all cursor-pointer font-mono"
                title="Select Consultation Language"
                aria-label="Select Consultation Language"
              >
                <option value="en-IN" className="bg-black text-white">
                  English (EN)
                </option>
                <option value="kn-IN" className="bg-black text-white">
                  ಕನ್ನಡ (KN)
                </option>
                <option value="hi-IN" className="bg-black text-white">
                  हिन्दी (HI)
                </option>
              </select>
            </div>

            {/* Microphone Voice Dictation Button */}
            {isSupported ? (
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={isBusy}
                className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/70 animate-pulse'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title={isListening ? 'Stop voice dictation (Listening...)' : 'Dictate query (Speech-to-Text)'}
                aria-label={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
              >
                <Mic className={`w-4 h-4 ${isListening ? 'text-red-500' : ''}`} />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="p-2 sm:p-2.5 rounded-full text-zinc-600 opacity-40 cursor-not-allowed"
                title="Voice dictation not supported in this browser"
                aria-label="Voice not supported"
              >
                <MicOff className="w-4 h-4" />
              </button>
            )}

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 sm:p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm cursor-pointer"
                title="Stop response generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || isBusy}
                className="p-2 sm:p-2.5 rounded-full bg-white hover:bg-zinc-200 text-black transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Send inquiry"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-2 px-1 text-[10px] text-zinc-500 text-center sm:text-left font-sans">
        <p>
          REAA synthesizes the RERA Act 2016 and K-RERA public disclosures. Output is for research purposes and does not constitute formal legal counsel.
        </p>
      </div>
    </div>
  );
});
