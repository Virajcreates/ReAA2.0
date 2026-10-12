'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Square, Sparkles, Mic, MicOff, Languages, Paperclip, FileText, X } from 'lucide-react';
import { ReraNamespace } from '@/types/rera';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface ChatInputProps {
  onSendMessage: (
    message: string,
    namespaces?: ReraNamespace[],
    language?: string,
    file?: File | File[] | null
  ) => void;
  onStop: () => void;
  isStreaming: boolean;
  isSubmitting?: boolean;
  statusText?: string;
  prefilledPrompt?: { text: string; id: number } | null;
}

export const ChatInput = React.memo(function ChatInput({
  onSendMessage,
  onStop,
  isStreaming,
  isSubmitting = false,
  statusText,
  prefilledPrompt,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    const MAX_FILES = 5;
    const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB

    const availableSlots = MAX_FILES - attachments.length;
    if (availableSlots <= 0) {
      alert(`Maximum limit reached: You can attach at most ${MAX_FILES} PDF documents.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const validNewFiles: File[] = [];
    let rejectedSlotsCount = 0;
    let sizeError = false;
    let typeError = false;

    for (const file of files) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        typeError = true;
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        sizeError = true;
        continue;
      }

      // Check duplicate within existing attachments or current batch
      const isDuplicate =
        attachments.some((existing) => existing.name === file.name && existing.size === file.size) ||
        validNewFiles.some((existing) => existing.name === file.name && existing.size === file.size);
      if (isDuplicate) {
        continue;
      }

      if (validNewFiles.length < availableSlots) {
        validNewFiles.push(file);
      } else {
        rejectedSlotsCount++;
      }
    }

    if (typeError) {
      alert('Only PDF documents are supported for document analysis.');
    }
    if (sizeError) {
      alert('One or more files exceeded the 6MB limit and were not attached.');
    }
    if (rejectedSlotsCount > 0) {
      alert(`Only ${availableSlots} file(s) were attached to stay within the ${MAX_FILES}-PDF limit.`);
    }

    if (validNewFiles.length > 0) {
      setAttachments((prev) => [...prev, ...validNewFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAllAttachments = () => {
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Quick suggestion chips representing the 8 core user personas
  const quickTags = [
    {
      label: 'Verify 70% Escrow Status',
      prompt: 'How do I verify the 70% separate escrow account compliance status for a registered project under Section 4(2)(l)(D)?',
    },
    {
      label: 'Sec 18 Delay Interest',
      prompt: 'What is the compensation and delay interest entitlement under Section 18 of RERA Act read with Karnataka Rule 18?',
    },
    {
      label: 'Promoter Track Record',
      prompt: "How can I assess a promoter's complete track record, active project delivery history, and past complaint exposure in K-RERA?",
    },
    {
      label: 'Verify Statutory Clearances',
      prompt: 'How do I verify mandatory statutory clearances including approved sanction plans, Commencement Certificate (CC), and Occupancy Certificate (OC)?',
    },
    {
      label: 'Form M vs Form N Rules',
      prompt: 'Explain the difference between Form M before the K-RERA Authority and Form N before the Adjudicating Officer under Section 71.',
    },
    {
      label: 'Aggregate Litigation Check',
      prompt: 'How can financial institutions run an aggregate litigation and land title dispute check across registered projects?',
    },
    {
      label: 'Pending RRC Enforcement',
      prompt: 'What is the procedure and enforcement timeline for executing pending Revenue Recovery Certificates (RRC) under Section 40?',
    },
    {
      label: 'Is this project safe to buy?',
      prompt: 'Is this project safe to buy? Provide a step-by-step buyer due diligence checklist based on K-RERA registration and disclosures.',
    },
  ];

  const handleSelectQuickInquiry = (promptText: string) => {
    setInput(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
      const match = promptText.match(/\[(.*?)\]/);
      if (match && match.index !== undefined) {
        textareaRef.current.setSelectionRange(match.index, match.index + match[0].length);
      } else {
        const len = promptText.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }
  };

  useEffect(() => {
    if (prefilledPrompt && prefilledPrompt.text) {
      handleSelectQuickInquiry(prefilledPrompt.text);
    }
  }, [prefilledPrompt]);

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
    if ((!input.trim() && attachments.length === 0) || isBusy) return;
    const textToSend =
      input.trim() ||
      (attachments.length === 1
        ? 'Please analyze this attached document and provide a comprehensive statutory breakdown of key clauses, dates, parties, and compliance obligations.'
        : `Please analyze these ${attachments.length} attached documents (${attachments.map((f) => f.name).join(', ')}) and provide a comprehensive statutory breakdown of key clauses, dates, parties, and compliance obligations.`);
    const filesToSend = [...attachments];
    setInput('');
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    baseTextRef.current = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(textToSend, undefined, selectedLang, filesToSend);
  };

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      {/* Quick Suggestions Chips with Infinite Marquee Animation */}
      <div className="flex items-center gap-2 pb-2 mb-1.5 overflow-hidden">
        <span className="text-[10px] font-mono font-semibold text-neutral-600 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 shrink-0 z-10 bg-neutral-300/60 px-2 py-0.5 rounded-full border border-neutral-400">
          <Sparkles className="w-3 h-3 text-neutral-800" />
          <span>Quick Inquiries:</span>
        </span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]">
          <div className="flex items-center w-max animate-marquee hover:[animation-play-state:paused]">
            {/* Primary Track */}
            <div className="flex items-center gap-1.5 pr-1.5 shrink-0">
              {quickTags.map((tag, idx) => (
                <button
                  key={`orig-${idx}`}
                  type="button"
                  onClick={() => handleSelectQuickInquiry(tag.prompt)}
                  disabled={isBusy}
                  className="text-[11px] px-3 py-1 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 hover:text-neutral-950 border border-neutral-400 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans shrink-0"
                >
                  {tag.label}
                </button>
              ))}
            </div>
            {/* Duplicate Track for Seamless Infinite Loop */}
            <div className="flex items-center gap-1.5 pr-1.5 shrink-0" aria-hidden="true">
              {quickTags.map((tag, idx) => (
                <button
                  key={`dup-${idx}`}
                  type="button"
                  onClick={() => handleSelectQuickInquiry(tag.prompt)}
                  disabled={isBusy}
                  tabIndex={-1}
                  className="text-[11px] px-3 py-1 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 hover:text-neutral-950 border border-neutral-400 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans shrink-0"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sleek Horizontal File Attachment Chips */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2 no-scrollbar animate-fade-in">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-300 border border-neutral-400 text-[10px] text-neutral-700 font-mono shrink-0">
            <span>{attachments.length}/5 PDFs</span>
          </div>
          {attachments.map((file, idx) => (
            <div
              key={`${file.name}-${file.size}-${idx}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-200 border border-neutral-400 text-xs text-neutral-900 shadow-sm font-mono shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[180px] font-medium text-neutral-900">
                {file.name}
              </span>
              <span className="text-[10px] text-neutral-600 shrink-0">
                ({file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`})
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                disabled={isBusy}
                className="ml-1 p-0.5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-300 transition-colors cursor-pointer"
                title={`Remove ${file.name}`}
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {attachments.length > 1 && (
            <button
              type="button"
              onClick={handleClearAllAttachments}
              disabled={isBusy}
              className="text-[10px] text-neutral-600 hover:text-red-600 underline font-mono shrink-0 cursor-pointer px-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Input Card Container */}
      <div className={`relative rounded-2xl bg-neutral-200 shadow-sm border transition-all duration-200 ${
        isListening
          ? 'border-red-500 ring-1 ring-red-500/50'
          : 'border-neutral-400 focus-within:border-neutral-600'
      }`}>
        {/* Status Indicator Pill if actively streaming */}
        {isStreaming && statusText && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-300 border-b border-neutral-400 rounded-t-2xl text-[11px] text-neutral-800 font-mono">
            <span className="w-2 h-2 rounded-full bg-neutral-800 animate-ping" />
            <span className="font-medium truncate">{statusText}</span>
          </div>
        )}

        {/* Active Voice Dictation Banner */}
        {isListening && (
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-red-50 border-b border-red-200 rounded-t-2xl text-[11px] text-red-700 animate-fade-in font-mono">
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
              className="text-[10px] uppercase font-semibold tracking-wider text-red-600 hover:text-red-800 transition-colors cursor-pointer"
            >
              Done Dictating
            </button>
          </div>
        )}

        {/* Speech Error Notice */}
        {speechError && (
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-amber-50 border-b border-amber-200 rounded-t-2xl text-[11px] text-amber-700 animate-fade-in font-mono">
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
                : attachments.length === 1
                ? `Ask questions about ${attachments[0].name} or press send to analyze...`
                : attachments.length > 1
                ? `Ask questions about the ${attachments.length} attached PDFs or press send to analyze...`
                : selectedLang === 'kn-IN'
                ? 'K-RERA ಅಥವಾ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ...'
                : selectedLang === 'hi-IN'
                ? 'K-RERA या रियल एस्टेट के बारे में हिन्दी में पूछें...'
                : 'Ask anything about K-RERA sections, delay compensation, project approvals, or statistics...'
            }
            className="flex-1 max-h-44 min-h-[42px] py-2 px-2.5 bg-transparent text-sm md:text-base text-neutral-900 placeholder:text-neutral-500 placeholder:text-xs sm:placeholder:text-sm focus:outline-none resize-none leading-relaxed disabled:opacity-60 font-sans"
          />

          {/* Action Cluster: PDF Upload + Language Selector + Voice Mic + Send / Stop */}
          <div className="flex items-center gap-1.5 sm:gap-2 pb-0.5 shrink-0">
            {/* Hidden Multiple PDF File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf"
              hidden
              onChange={handleFileChange}
            />

            {/* Minimalist Paperclip Upload Button with badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy || attachments.length >= 5}
              className={`relative p-2 sm:p-2.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                attachments.length > 0
                  ? 'bg-neutral-300 text-neutral-800 border border-neutral-400 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-300'
              }`}
              title={
                attachments.length >= 5
                  ? 'Maximum 5 PDFs attached'
                  : attachments.length > 0
                  ? `${attachments.length}/5 PDFs attached (Click to add more)`
                  : 'Attach up to 5 PDFs (Max 6MB each)'
              }
              aria-label="Attach PDF"
            >
              <Paperclip className="w-4 h-4" />
              {attachments.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-800 text-[9px] font-bold text-neutral-50 shadow">
                  {attachments.length}
                </span>
              )}
            </button>

            {/* Compact Language Selector Dropdown */}
            <div className="relative flex items-center">
              <Languages className="w-3.5 h-3.5 text-neutral-500 absolute left-2 pointer-events-none" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                disabled={isBusy}
                className="appearance-none pl-6 pr-2.5 py-1.5 sm:py-2 rounded-full bg-neutral-300/80 hover:bg-neutral-300 text-neutral-800 text-xs font-medium border border-neutral-400 focus:outline-none focus:border-neutral-600 transition-all cursor-pointer font-mono"
                title="Select Consultation Language"
                aria-label="Select Consultation Language"
              >
                <option value="en-IN" className="bg-neutral-200 text-neutral-800">
                  Eng
                </option>
                <option value="kn-IN" className="bg-neutral-200 text-neutral-800">
                  Kan
                </option>
                <option value="hi-IN" className="bg-neutral-200 text-neutral-800">
                  Hin
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
                    ? 'bg-red-500/20 text-red-600 ring-1 ring-red-500/70 animate-pulse'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-300'
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
                className="p-2 sm:p-2.5 rounded-full text-neutral-400 opacity-40 cursor-not-allowed"
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
                disabled={(!input.trim() && attachments.length === 0) || isBusy}
                className="p-2 sm:p-2.5 rounded-full bg-neutral-800 hover:bg-neutral-900 text-neutral-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                title="Send inquiry"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-2 px-1 text-[10px] text-neutral-600 text-center sm:text-left font-sans">
        <p>
          REAA synthesizes statutory provisions under the RERA Act, 2016 and official K-RERA public disclosures. All information is derived exclusively from public regulatory filings current through August 2026, containing no private or confidential data.
        </p>
      </div>
    </div>
  );
});
