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
} from 'lucide-react';
import { getNamespaceBadgeClasses } from '@/lib/utils';
import { RERA_NAMESPACES } from '@/types/rera';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
}

export function MessageItem({ message, onRegenerate }: MessageItemProps) {
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
      className={`w-full py-5 px-4 md:px-6 transition-all animate-fade-in ${
        isUser
          ? 'bg-transparent'
          : 'bg-zinc-100/40 dark:bg-zinc-900/30 border-y border-zinc-200/40 dark:border-zinc-850/40'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3.5 md:gap-4.5">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isAssistant ? (
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border border-zinc-700 dark:border-zinc-300 flex items-center justify-center shadow-sm">
              <Scale className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 border border-zinc-300/60 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-medium shadow-2xs">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Body Container */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header Metadata Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                {isAssistant ? 'ReAA 2.0 Advisory Agent' : 'You'}
              </span>

              {/* Glowing Thinking Pill Indicator */}
              {isAssistant && message.status === 'generating' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium animate-tool-pulse">
                  <Sparkles className="w-3 h-3 text-zinc-500 dark:text-zinc-400 animate-spin" />
                  <span>Synthesizing legal opinion...</span>
                </span>
              )}

              {isAssistant && message.status === 'retrieving' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  <span>Searching Tri-Database RAG stores...</span>
                </span>
              )}
            </div>

            {/* Message Action Controls */}
            {isAssistant && message.content && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
                  title="Copy full response"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-zinc-100" />
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">Copied</span>
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
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
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
              <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mr-1">
                <Database className="w-3 h-3 text-zinc-400" />
                <span>Routed Stores:</span>
              </span>
              {message.routedNamespaces.map((ns) => {
                const info = RERA_NAMESPACES[ns];
                const badge = getNamespaceBadgeClasses(ns);
                return (
                  <span
                    key={ns}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {info ? info.shortLabel : ns}
                  </span>
                );
              })}
            </div>
          )}

          {/* Main Message Content */}
          {isUser ? (
            <div className="ml-auto max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-tr-xs bg-zinc-800/90 dark:bg-zinc-800/80 text-zinc-100 border border-zinc-700/60 shadow-sm px-4 py-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          ) : (
            <div className="prose prose-zinc dark:prose-invert max-w-none text-sm md:text-base leading-relaxed break-words space-y-3.5">
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2 pb-1 border-b border-zinc-200/80 dark:border-zinc-800/80">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-3.5 mb-1.5">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-200 mt-3 mb-1">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed mb-2.5">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 space-y-1 text-zinc-800 dark:text-zinc-300 my-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 space-y-1 text-zinc-800 dark:text-zinc-300 my-2">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-zinc-950 dark:text-zinc-100">
                        {children}
                      </strong>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-3 border-zinc-400 dark:border-zinc-500 pl-3.5 py-1.5 my-3 bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 rounded-r-lg text-xs md:text-sm">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
                        <table className="min-w-full divide-y divide-zinc-200/80 dark:divide-zinc-800 text-xs md:text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 bg-transparent">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3.5 py-2.5 whitespace-normal text-zinc-800 dark:text-zinc-300">
                        {children}
                      </td>
                    ),
                    a: ({ href, children, ...props }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline underline-offset-3 font-medium inline-flex items-center gap-1 break-words transition-colors"
                        {...props}
                      >
                        <span>{children}</span>
                        <ExternalLink className="w-3 h-3 inline flex-shrink-0 opacity-70" />
                      </a>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-200 font-mono text-xs border border-zinc-200/50 dark:border-zinc-700/50">
                          {children}
                        </code>
                      ) : (
                        <code className="block p-3.5 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto my-2 border border-zinc-800 shadow-inner">
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : message.status === 'error' ? (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs md:text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{message.error || 'An error occurred while generating advisory response.'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3 text-zinc-400 dark:text-zinc-500 text-xs md:text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  <span>Consulting statutory provisions and database indices...</span>
                </div>
              )}
            </div>
          )}

          {/* Citations & Legal Grounding Drawer */}
          {isAssistant && message.citations && message.citations.length > 0 && (
            <div className="pt-3 mt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Verified Legal Grounding & Citations ({message.citations.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
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
}
