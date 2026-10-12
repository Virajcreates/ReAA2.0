'use client';

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/chat';
import { CitationPill } from './CitationPill';
import {
  Scale,
  User,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  Database,
  Layers,
  ExternalLink,
  RotateCw,
  FileText,
} from 'lucide-react';
import { getNamespaceBadgeClasses, extractSuggestionsFromContent } from '@/lib/utils';
import { RERA_NAMESPACES } from '@/types/rera';

/**
 * Modular CopyableTable component override.
 * Renders a relative group container with a subtle copy button that extracts both HTML & plain text.
 */
function CopyableTable({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const handleCopyTable = async () => {
    if (!tableRef.current) return;
    const tableEl = tableRef.current;
    const htmlContent = tableEl.outerHTML;

    const rowElements = Array.from(tableEl.querySelectorAll('tr'));
    if (rowElements.length === 0) return;

    // Parse into 2D array of cleaned strings (trim whitespace and replace internal newlines with spaces)
    const tableData: string[][] = rowElements
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map((cell) => {
          const raw = (cell as HTMLElement).innerText || '';
          return raw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        });
      })
      .filter((row) => row.length > 0);

    if (tableData.length === 0) return;

    // Calculate maximum string length for each column index across all rows
    const numCols = Math.max(...tableData.map((row) => row.length));
    const maxWidths: number[] = Array(numCols).fill(3); // Minimum width of 3 for markdown divider dashes

    for (let c = 0; c < numCols; c++) {
      for (const row of tableData) {
        const cellText = row[c] || '';
        if (cellText.length > maxWidths[c]) {
          maxWidths[c] = cellText.length;
        }
      }
    }

    // Format rows with space padding and construct aligned Markdown table
    const formattedRows: string[] = [];

    tableData.forEach((row, rowIndex) => {
      const paddedCells = Array.from({ length: numCols }, (_, colIndex) => {
        const cellText = row[colIndex] || '';
        return cellText.padEnd(maxWidths[colIndex], ' ');
      });

      formattedRows.push(`| ${paddedCells.join(' | ')} |`);

      // Inject standard Markdown divider row immediately after the header row
      if (rowIndex === 0) {
        const dividerCells = maxWidths.map((w) => '-'.repeat(w));
        formattedRows.push(`| ${dividerCells.join(' | ')} |`);
      }
    });

    const plainText = formattedRows.join('\n');

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('ClipboardItem HTML copy failed, falling back to writeText:', err);
      try {
        await navigator.clipboard.writeText(plainText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy table text:', fallbackErr);
      }
    }
  };

  return (
    <div className="relative group my-3.5 rounded-xl border border-neutral-400 bg-neutral-200 shadow-sm transition-all duration-300 ease-out">
      {/* Floating Copy Table Button */}
      <button
        onClick={handleCopyTable}
        type="button"
        className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-600 hover:text-neutral-900 border border-neutral-400 text-[11px] font-mono shadow-sm backdrop-blur-xs cursor-pointer"
        title="Copy Table to Clipboard (HTML & Plain Text)"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-neutral-900" />
            <span className="text-neutral-900 font-medium">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Table</span>
          </>
        )}
      </button>

      {/* Scrollable table viewport */}
      <div className="overflow-x-auto">
        <table ref={tableRef} className="min-w-full divide-y divide-neutral-400 text-xs md:text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  streamContent?: string;
  isLast?: boolean;
  onSelectPrompt?: (promptText: string) => void;
}

export const MessageItem = React.memo(function MessageItem({
  message,
  onRegenerate,
  streamContent,
  isLast = false,
  onSelectPrompt,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';
  const isUser = message.role === 'user';
  const isStreaming = isAssistant && message.status === 'generating';

  // Lock-in mechanism: Once assistant content has been received/streamed, lock it in so it NEVER disappears or reverts
  const lockedContentRef = useRef<string>('');

  // Normalize message content across various property aliases (content, text, response, message, body, parts)
  const rawMessageContent =
    message.content ||
    (message as any).text ||
    (message as any).response ||
    (message as any).message ||
    (message as any).body ||
    ((message as any).parts?.find((p: any) => p.type === 'text')?.text) ||
    '';

  const { cleanContent: cleanRawContent, suggestions: rawExtractedSuggestions } =
    extractSuggestionsFromContent(rawMessageContent);

  const { cleanContent: cleanStreamContent, suggestions: streamExtractedSuggestions } =
    extractSuggestionsFromContent(streamContent !== undefined ? streamContent : '');

  // Determine incoming content (prefer active stream buffer if non-empty, otherwise stored message content)
  const incomingContent =
    streamContent !== undefined && streamContent.length > 0
      ? cleanStreamContent
      : cleanRawContent;

  // Once any text arrives, lock it in and ratchet forward to always keep the maximum accumulated text
  if (incomingContent && incomingContent.length >= lockedContentRef.current.length) {
    lockedContentRef.current = incomingContent;
  }

  // When message has completed or is in stable state, ensure locked content retains final message content
  if (cleanRawContent && (message.status === 'done' || message.status === 'idle' || !message.status)) {
    if (cleanRawContent.length >= lockedContentRef.current.length || !lockedContentRef.current) {
      lockedContentRef.current = cleanRawContent;
    }
  }

  // Active display content: locked content takes priority to prevent post-stream disappearance
  const activeContent = lockedContentRef.current || incomingContent;

  // Resolve suggestions: prefer explicit message.suggestions, then stream extracted, then raw extracted
  const suggestions =
    (message.suggestions && message.suggestions.length > 0)
      ? message.suggestions
      : streamExtractedSuggestions.length > 0
      ? streamExtractedSuggestions
      : rawExtractedSuggestions;

  const hasTextContent = Boolean(activeContent && activeContent.trim().length > 0);
  const isMessageDone = message.status === 'done';
  const hasCitations = Boolean(message.citations && message.citations.length > 0);

  // Active stream in flight check: Only show loading spinner if actively streaming right now
  const isActivelyStreaming =
    Boolean(streamContent !== undefined && streamContent.length > 0) ||
    message.status === 'generating' ||
    message.status === 'routing' ||
    message.status === 'retrieving';

  // Strict loading suppression:
  // - Historical messages (loaded from DB/storage) must NEVER show loading spinner
  // - If any text content is present, loading is permanently suppressed
  // - If message is completed ('done') or errored, loading is suppressed
  // - Only render loading indicator if actively streaming right now with zero content
  const showLoadingIndicator =
    isAssistant &&
    (isLast || isActivelyStreaming) &&
    isActivelyStreaming &&
    !hasTextContent &&
    !isMessageDone &&
    message.status !== 'error';

  const copyToClipboard = () => {
    const textToCopy = activeContent || rawMessageContent;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`w-full py-5 px-4 md:px-6 transition-all duration-300 ease-out animate-fade-in ${
        isUser
          ? 'bg-transparent'
          : 'bg-neutral-200 border-y border-neutral-400 shadow-sm'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3.5 md:gap-4.5 transition-all duration-300 ease-out">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isAssistant ? (
            <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-50 flex items-center justify-center font-bold shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-300 text-neutral-800 border border-neutral-400 flex items-center justify-center font-medium">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Body Container */}
        <div className="flex-1 min-w-0 space-y-2.5 transition-all duration-300 ease-out">
          {/* Header Metadata Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-display font-semibold text-neutral-900">
                {isAssistant ? 'REAA Advisory Agent' : 'You'}
              </span>

              {/* Status Indicator */}
              {isAssistant && message.status === 'routing' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-300 border border-neutral-400 text-neutral-700 text-[11px] font-mono">
                  <Loader2 className="w-3 h-3 animate-spin text-neutral-900" />
                  <span>Consulting statutory provisions...</span>
                </span>
              )}

              {isAssistant && message.status === 'retrieving' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-300 border border-neutral-400 text-neutral-700 text-[11px] font-mono">
                  <Loader2 className="w-3 h-3 animate-spin text-neutral-900" />
                  <span>Searching Tri-Database RAG stores...</span>
                </span>
              )}

              {isAssistant && message.status === 'generating' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-300 border border-neutral-400 text-neutral-700 text-[11px] font-mono">
                  <Sparkles className="w-3 h-3 text-neutral-900 animate-spin" />
                  <span>Synthesizing legal opinion...</span>
                </span>
              )}
            </div>

            {/* Message Action Controls */}
            {isAssistant && (message.content || activeContent) && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 px-2 py-1 rounded-full hover:bg-neutral-300 transition-colors cursor-pointer font-mono"
                  title="Copy full response"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-neutral-900" />
                      <span className="text-neutral-900 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 px-2 py-1 rounded-full hover:bg-neutral-300 transition-colors cursor-pointer font-mono"
                    title="Regenerate legal advisory"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Retry</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Routed Knowledge Namespaces Indicator */}
          {isAssistant && message.routedNamespaces && message.routedNamespaces.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-neutral-500 mr-1">
                <Database className="w-3 h-3 text-neutral-500" />
                <span>Routed Stores:</span>
              </span>
              {message.routedNamespaces.map((ns) => {
                const info = RERA_NAMESPACES[ns];
                return (
                  <span
                    key={ns}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border border-neutral-400 bg-neutral-300 text-neutral-800"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                    {info ? info.shortLabel : ns}
                  </span>
                );
              })}
            </div>
          )}

          {/* Main Message Content */}
          {isUser ? (
            <div className="ml-auto max-w-[90%] sm:max-w-[80%] flex flex-col items-end gap-1.5">
              {/* Multi-PDF Attachment Badges */}
              {message.attachments && message.attachments.length > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-1.5 mb-1 max-w-full">
                  {message.attachments.map((att, idx) => {
                    const name = typeof att === 'string' ? att : att.name;
                    const size = typeof att !== 'string' ? att.size : undefined;
                    const sizeLabel = size
                      ? ` (${size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${(size / 1024).toFixed(0)} KB`})`
                      : '';
                    return (
                      <div
                        key={`${name}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-200 border border-neutral-400 text-xs text-neutral-800 font-mono shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-xs text-neutral-900" title={name}>
                          {name}
                        </span>
                        {sizeLabel && <span className="text-[10px] text-neutral-500 shrink-0">{sizeLabel}</span>}
                      </div>
                    );
                  })}
                </div>
              ) : message.fileName ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-200 border border-neutral-400 text-xs text-neutral-800 font-mono">
                  <FileText className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="truncate max-w-[200px] sm:max-w-xs">{message.fileName}</span>
                </div>
              ) : null}
              <div className="w-full rounded-2xl rounded-tr-xs bg-neutral-800 text-neutral-50 font-sans px-4 py-2.5 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium shadow-xs">
                {message.content}
              </div>
            </div>
          ) : (
            <div className="prose prose-neutral max-w-none text-sm md:text-base leading-relaxed break-words transition-all duration-300 ease-out font-sans text-neutral-900 prose-a:text-neutral-900 hover:prose-a:text-neutral-950 prose-a:underline prose-a:decoration-neutral-500/60 hover:prose-a:decoration-neutral-900 prose-a:underline-offset-4">
              {activeContent ? (
                <div className="relative min-w-0 overflow-x-hidden transition-all duration-200 ease-out will-change-[height]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg md:text-xl font-display font-bold text-neutral-900 mt-4 mb-2 pb-1 border-b border-neutral-400 leading-snug break-words">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base md:text-lg font-display font-bold text-neutral-900 mt-4 mb-2 leading-snug break-words">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm md:text-base font-display font-semibold text-neutral-900 mt-3.5 mb-1.5 leading-snug break-words">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-neutral-800 leading-relaxed mb-3 mt-0 break-words">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1.5 text-neutral-800 my-3 leading-relaxed break-words">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 space-y-1.5 text-neutral-800 my-3 leading-relaxed break-words">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li className="leading-relaxed pl-0.5 text-neutral-800 break-words">{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-neutral-900">
                          {children}
                        </strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-neutral-800 pl-3.5 py-1.5 my-3 bg-neutral-300/70 text-neutral-800 rounded-r-lg text-xs md:text-sm leading-relaxed border-y border-r border-neutral-400 break-words">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => <CopyableTable>{children}</CopyableTable>,
                      thead: ({ children }) => (
                        <thead className="bg-neutral-300 font-display font-semibold text-neutral-900 border-b border-neutral-400">
                          {children}
                        </thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-neutral-400 bg-neutral-200">
                          {children}
                        </tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-neutral-300/60 transition-colors">
                          {children}
                        </tr>
                      ),
                      th: ({ children }) => (
                        <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-900 font-display border-b border-neutral-400">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-3.5 py-2.5 whitespace-normal text-neutral-900 font-sans break-words border-b border-neutral-400">
                          {children}
                        </td>
                      ),
                      a: ({ href, children, ...props }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-900 hover:text-neutral-950 underline decoration-neutral-500/60 hover:decoration-neutral-900 underline-offset-4 font-semibold inline-flex items-center gap-1 break-words transition-colors font-sans"
                          {...props}
                        >
                          <span>{children}</span>
                          <ExternalLink className="w-3.5 h-3.5 inline flex-shrink-0 opacity-80" />
                        </a>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="px-1.5 py-0.5 rounded bg-neutral-300 text-neutral-900 font-mono text-[11px] border border-neutral-400 break-words">
                            {children}
                          </code>
                        ) : (
                          <code className="block p-3.5 rounded-xl bg-neutral-800 text-neutral-100 font-mono text-xs overflow-x-auto my-2 border border-neutral-700">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {activeContent}
                  </ReactMarkdown>
                  {isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-neutral-800 rounded-sm animate-pulse" />
                  )}
                </div>
              ) : message.status === 'error' ? (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm transition-all duration-300 ease-out font-sans">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{message.error || 'An error occurred while generating advisory response.'}</span>
                </div>
              ) : showLoadingIndicator ? (
                <div className="flex items-center gap-3 py-3 text-neutral-500 text-xs md:text-sm transition-all duration-300 ease-out font-sans">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-800" />
                  <span>
                    {message.status === 'retrieving'
                      ? 'Consulting statutory provisions and database indices...'
                      : message.status === 'generating'
                      ? 'Synthesizing verified legal advisory opinion...'
                      : 'Consulting statutory provisions...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-300/60 border border-neutral-400 text-neutral-700 text-xs md:text-sm font-sans gap-3">
                  <span>Advisory output recorded. Verified statutory citations are detailed below.</span>
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-50 hover:bg-neutral-900 text-xs font-medium cursor-pointer shrink-0 transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Citations & Legal Grounding Drawer */}
          {isAssistant && message.citations && message.citations.length > 0 && (
            <div className="pt-3 mt-3 border-t border-neutral-400 transition-all duration-300 ease-out">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-neutral-800" />
                <span className="text-[11px] font-mono font-semibold text-neutral-600 uppercase tracking-wider">
                  Verified Legal Grounding & Citations ({message.citations.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2 transition-all duration-300 ease-out">
                {message.citations.map((citation, index) => (
                  <CitationPill key={citation.id || index} citation={citation} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Contextual Follow-Up Question Suggestions */}
          {isAssistant && suggestions && suggestions.length > 0 && !isStreaming && (
            <div className="pt-3.5 mt-3.5 border-t border-neutral-400 transition-all duration-300 ease-out">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-xs font-semibold text-neutral-800">
                  ✨ Related Questions / Next Steps:
                </span>
              </div>
              <div className="flex flex-wrap gap-2 transition-all duration-300 ease-out">
                {suggestions.map((question, idx) => (
                  <button
                    key={`${question}-${idx}`}
                    type="button"
                    onClick={() => onSelectPrompt?.(question)}
                    className="text-left px-3 py-1.5 rounded-lg border border-neutral-400 bg-neutral-300/70 hover:bg-neutral-300 hover:border-neutral-500 text-neutral-800 hover:text-neutral-950 text-xs md:text-sm font-sans transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.98]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.streamContent === nextProps.streamContent &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.message.citations?.length === nextProps.message.citations?.length &&
    prevProps.message.routedNamespaces?.length === nextProps.message.routedNamespaces?.length &&
    prevProps.message.suggestions?.length === nextProps.message.suggestions?.length &&
    prevProps.onRegenerate === nextProps.onRegenerate &&
    prevProps.onSelectPrompt === nextProps.onSelectPrompt
  );
});
