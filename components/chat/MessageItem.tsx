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
          : 'bg-slate-900/40 dark:bg-slate-900/25 border-y border-slate-200/40 dark:border-slate-800/60'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3.5 md:gap-4.5">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isAssistant ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 text-white flex items-center justify-center shadow-glow ring-1 ring-indigo-400/40">
              <Scale className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Body Container */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header Metadata Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-200">
                {isAssistant ? 'ReAA 2.0 Advisory Agent' : 'You'}
              </span>

              {/* Glowing Thinking Pill Indicator */}
              {isAssistant && message.status === 'generating' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-950/60 border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium animate-pulse-glow backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400 animate-spin" />
                  <span>Synthesizing legal opinion...</span>
                </span>
              )}

              {isAssistant && message.status === 'retrieving' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-950/60 border border-blue-500/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium backdrop-blur-xs">
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
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-800/60 transition-all cursor-pointer"
                  title="Copy full response"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-indigo-400 font-medium">Copied</span>
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
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-800/60 transition-all cursor-pointer"
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
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 mr-1">
                <Database className="w-3 h-3 text-slate-400" />
                <span>Routed Stores:</span>
              </span>
              {message.routedNamespaces.map((ns) => {
                const info = RERA_NAMESPACES[ns];
                const badge = getNamespaceBadgeClasses(ns);
                return (
                  <span
                    key={ns}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
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
            <div className="ml-auto max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-tr-xs bg-slate-800/90 dark:bg-slate-800/90 text-slate-100 border border-slate-700/80 border-t-slate-600 shadow-md shadow-black/20 px-4 py-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm md:text-base leading-relaxed break-words space-y-3.5">
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50 mt-4 mb-2 pb-1 border-b border-slate-200/80 dark:border-slate-800">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 mt-3.5 mb-1.5">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed mb-2.5">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 space-y-1 text-slate-800 dark:text-slate-200 my-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 space-y-1 text-slate-800 dark:text-slate-200 my-2">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-slate-950 dark:text-white">
                        {children}
                      </strong>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-3 border-indigo-500 pl-3.5 py-1.5 my-3 bg-indigo-50/40 dark:bg-indigo-950/25 text-slate-700 dark:text-slate-300 rounded-r-lg text-xs md:text-sm">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-md shadow-black/20">
                        <table className="min-w-full divide-y divide-slate-200/80 dark:divide-slate-800 text-xs md:text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-slate-100 dark:bg-slate-800/90 font-semibold text-slate-900 dark:text-slate-100">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 bg-transparent">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3.5 py-2.5 whitespace-normal text-slate-800 dark:text-slate-300">
                        {children}
                      </td>
                    ),
                    a: ({ href, children, ...props }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 underline underline-offset-3 font-medium inline-flex items-center gap-1 break-words transition-colors"
                        {...props}
                      >
                        <span>{children}</span>
                        <ExternalLink className="w-3 h-3 inline flex-shrink-0 opacity-70" />
                      </a>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-300 font-mono text-xs border border-slate-200/50 dark:border-slate-700/60">
                          {children}
                        </code>
                      ) : (
                        <code className="block p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto my-2 border border-slate-800 shadow-inner">
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
                <div className="flex items-center gap-3 py-3 text-slate-400 dark:text-slate-500 text-xs md:text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Consulting statutory provisions and database indices...</span>
                </div>
              )}
            </div>
          )}

          {/* Citations & Legal Grounding Drawer */}
          {isAssistant && message.citations && message.citations.length > 0 && (
            <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
