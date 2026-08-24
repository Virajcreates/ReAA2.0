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
  RotateCw,
  Sparkles,
  Loader2,
  AlertCircle,
  Database,
  Layers,
  ExternalLink,
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
      className={`w-full py-6 px-4 md:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-zinc-50/70 dark:bg-zinc-900/60 border-y border-zinc-200/50 dark:border-zinc-800/60'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 md:gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isAssistant ? (
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30">
              <Scale className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-medium">
              <User className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          )}
        </div>

        {/* Message Content Area */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header & Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {isAssistant ? 'K-RERA Advisory Agent' : 'You'}
              </span>

              {isAssistant && message.status === 'generating' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesizing...</span>
                </span>
              )}

              {isAssistant && message.status === 'retrieving' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching Pinecone namespaces...</span>
                </span>
              )}
            </div>

            {/* Copy button */}
            {isAssistant && message.content && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Routed Namespaces Indicator */}
          {isAssistant && message.routedNamespaces && message.routedNamespaces.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mr-1">
                <Database className="w-3 h-3 text-zinc-400" />
                <span>RAG Vector Stores:</span>
              </span>
              {message.routedNamespaces.map((ns) => {
                const info = RERA_NAMESPACES[ns];
                const badge = getNamespaceBadgeClasses(ns);
                return (
                  <span
                    key={ns}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {info ? info.shortLabel : ns}
                  </span>
                );
              })}
            </div>
          )}

          {/* Body Content / Markdown */}
          {isUser ? (
            <div className="text-zinc-900 dark:text-zinc-100 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          ) : (
            <div className="prose prose-zinc dark:prose-invert max-w-none text-sm md:text-base leading-relaxed break-words space-y-4">
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mt-3 mb-1.5">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 space-y-1 text-zinc-800 dark:text-zinc-200 my-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 space-y-1 text-zinc-800 dark:text-zinc-200 my-2">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {children}
                      </strong>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-emerald-500 pl-4 py-1.5 my-3 bg-emerald-50/50 dark:bg-emerald-950/20 text-zinc-700 dark:text-zinc-300 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs md:text-sm">
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
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900/40">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">{children}</tr>,
                    th: ({ children }) => (
                      <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => <td className="px-3.5 py-2.5 whitespace-normal">{children}</td>,
                    a: ({ href, children, ...props }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-2 font-medium inline-flex items-center gap-1 break-words transition-colors"
                        {...props}
                      >
                        <span>{children}</span>
                        <ExternalLink className="w-3 h-3 inline flex-shrink-0 opacity-70" />
                      </a>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                          {children}
                        </code>
                      ) : (
                        <code className="block p-3 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto my-2">
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : message.status === 'error' ? (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{message.error || 'An error occurred while generating response.'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-4 text-zinc-500 dark:text-zinc-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <span>Consulting statutory provisions and formulating advisory opinion...</span>
                </div>
              )}
            </div>
          )}

          {/* Citations Bar */}
          {isAssistant && message.citations && message.citations.length > 0 && (
            <div className="pt-3 mt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Retrieved Legal Citations & Grounding ({message.citations.length})
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
