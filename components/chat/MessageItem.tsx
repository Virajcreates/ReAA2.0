'use client';

import React, { useState } from 'react';
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
import { getNamespaceBadgeClasses } from '@/lib/utils';
import { RERA_NAMESPACES } from '@/types/rera';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
}

export const MessageItem = React.memo(function MessageItem({ message, onRegenerate }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';
  const isUser = message.role === 'user';

  const copyToClipboard = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`w-full py-5 px-4 md:px-6 transition-all duration-300 ease-out animate-fade-in ${
        isUser
          ? 'bg-transparent'
          : 'bg-black/40 border-y border-white/10'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3.5 md:gap-4.5 transition-all duration-300 ease-out">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isAssistant ? (
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center font-medium">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Body Container */}
        <div className="flex-1 min-w-0 space-y-2.5 transition-all duration-300 ease-out">
          {/* Header Metadata Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-display font-semibold text-white">
                {isAssistant ? 'REAA Advisory Agent' : 'You'}
              </span>

              {/* Status Indicator */}
              {isAssistant && message.status === 'generating' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-white text-[11px] font-mono backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-white animate-spin" />
                  <span>Synthesizing legal opinion...</span>
                </span>
              )}

              {isAssistant && message.status === 'retrieving' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-white text-[11px] font-mono backdrop-blur-xs">
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                  <span>Searching Tri-Database RAG stores...</span>
                </span>
              )}
            </div>

            {/* Message Action Controls */}
            {isAssistant && message.content && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white px-2 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer font-mono"
                  title="Copy full response"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span className="text-white font-medium">Copied</span>
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
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white px-2 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer font-mono"
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
              <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-zinc-500 mr-1">
                <Database className="w-3 h-3 text-zinc-500" />
                <span>Routed Stores:</span>
              </span>
              {message.routedNamespaces.map((ns) => {
                const info = RERA_NAMESPACES[ns];
                return (
                  <span
                    key={ns}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border border-white/15 bg-white/5 text-white"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    {info ? info.shortLabel : ns}
                  </span>
                );
              })}
            </div>
          )}

          {/* Main Message Content */}
          {isUser ? (
            <div className="ml-auto max-w-[90%] sm:max-w-[80%] flex flex-col items-end gap-1.5">
              {message.fileName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-zinc-300 font-mono backdrop-blur-xs">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate max-w-[200px] sm:max-w-xs">{message.fileName}</span>
                </div>
              )}
              <div className="w-full rounded-2xl rounded-tr-xs bg-white text-black font-sans px-4 py-2.5 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                {message.content}
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed break-words transition-all duration-300 ease-out font-sans text-white prose-a:text-blue-400 prose-a:underline prose-a:decoration-blue-400/40 hover:prose-a:decoration-blue-300 prose-a:underline-offset-4">
              {message.content ? (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg md:text-xl font-display font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10 leading-snug">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base md:text-lg font-display font-bold text-white mt-4 mb-2 leading-snug">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm md:text-base font-display font-semibold text-white mt-3.5 mb-1.5 leading-snug">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-white leading-relaxed mb-3 mt-0">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1.5 text-white my-3 leading-relaxed">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 space-y-1.5 text-white my-3 leading-relaxed">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li className="leading-relaxed pl-0.5 text-white">{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white">
                          {children}
                        </strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-white pl-3.5 py-1.5 my-3 bg-white/5 text-zinc-200 rounded-r-lg text-xs md:text-sm leading-relaxed border-y border-r border-white/10">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3.5 rounded-xl border border-white/10 bg-black transition-all duration-300 ease-out">
                          <table className="min-w-full divide-y divide-white/10 text-xs md:text-sm">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-white/5 font-display font-semibold text-white border-b border-white/10">
                          {children}
                        </thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-white/10 bg-transparent">
                          {children}
                        </tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-white/5 transition-colors">
                          {children}
                        </tr>
                      ),
                      th: ({ children }) => (
                        <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 font-display">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-3.5 py-2.5 whitespace-normal text-zinc-300 font-sans">
                          {children}
                        </td>
                      ),
                      a: ({ href, children, ...props }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/40 hover:decoration-blue-300 underline-offset-4 font-medium inline-flex items-center gap-1 break-words transition-colors font-sans"
                          {...props}
                        >
                          <span>{children}</span>
                          <ExternalLink className="w-3.5 h-3.5 inline flex-shrink-0 opacity-80" />
                        </a>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[11px] border border-white/20">
                            {children}
                          </code>
                        ) : (
                          <code className="block p-3.5 rounded-xl bg-zinc-950 text-white font-mono text-xs overflow-x-auto my-2 border border-white/10">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.status === 'generating' && (
                    <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-white animate-pulse rounded-xs" />
                  )}
                </>
              ) : message.status === 'error' ? (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs md:text-sm transition-all duration-300 ease-out font-sans">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{message.error || 'An error occurred while generating advisory response.'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3 text-zinc-500 text-xs md:text-sm transition-all duration-300 ease-out font-sans">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Consulting statutory provisions and database indices...</span>
                </div>
              )}
            </div>
          )}

          {/* Citations & Legal Grounding Drawer */}
          {isAssistant && message.citations && message.citations.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/10 transition-all duration-300 ease-out">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">
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
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.citations?.length === nextProps.message.citations?.length &&
    prevProps.message.routedNamespaces?.length === nextProps.message.routedNamespaces?.length &&
    prevProps.onRegenerate === nextProps.onRegenerate
  );
});
