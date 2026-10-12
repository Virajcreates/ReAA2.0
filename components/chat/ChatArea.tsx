'use client';

import React, { useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { MessageItem } from './MessageItem';
import { EmptyState } from './EmptyState';
import { ReraNamespace } from '@/types/rera';
import { useLiquidStream } from '@/hooks/use-liquid-stream';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string, namespaces?: ReraNamespace[], language?: string) => void;
  isStreaming: boolean;
  onSelectPrompt?: (promptText: string) => void;
}

export const ChatArea = React.memo(function ChatArea({
  messages,
  onSendMessage,
  isStreaming,
  onSelectPrompt,
}: ChatAreaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Ensure strict chronological ascending order (oldest first, newest last)
  const sortedMessages = React.useMemo(() => {
    return [...messages].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      if (timeA !== timeB) return timeA - timeB;
      if (a.role === 'user' && b.role === 'assistant') return -1;
      if (a.role === 'assistant' && b.role === 'user') return 1;
      return 0;
    });
  }, [messages]);

  // Extract the active streaming assistant message
  const lastMessage = sortedMessages[sortedMessages.length - 1];
  const isLastAssistant = lastMessage?.role === 'assistant';
  const isLastAssistantGenerating =
    isStreaming && isLastAssistant && lastMessage.status === 'generating';

  // Liquid Stream Buffer: buffers clunky network chunks and delivers a continuous fluid stream.
  // Preserves text for completed assistant message to prevent stream wipe/reset.
  const displayedText = useLiquidStream(
    isLastAssistant ? (lastMessage.content || '') : '',
    isLastAssistantGenerating
  );

  // Track scroll timing and message count for smooth auto-scroll without collision
  const lastScrollTimeRef = useRef<number>(0);
  const prevMsgCountRef = useRef<number>(messages.length);

  // When a new message is appended (e.g. user sends query), scroll to bottom immediately
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      prevMsgCountRef.current = messages.length;
      const container = containerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } else {
      prevMsgCountRef.current = messages.length;
    }
  }, [messages.length]);

  // Throttled auto-scroll tracking streaming text with user intent protection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const now = Date.now();
    // Throttle scroll execution during streaming to at most once every 120ms
    if (isStreaming && now - lastScrollTimeRef.current < 120) {
      return;
    }
    lastScrollTimeRef.current = now;

    // User Intent Guard: only auto-scroll if user is already near the bottom (< 120px)
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 120;

    if (isNearBottom) {
      if (isStreaming) {
        // Direct DOM scroll during streaming eliminates smooth-scroll animation collisions & jitter
        container.scrollTop = container.scrollHeight;
      } else {
        // When not generating, settle gently with smooth scroll
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }
    }
  }, [displayedText, messages.length, isStreaming]);

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 overflow-y-auto [overflow-anchor:auto] flex items-start justify-center p-3 sm:p-4 md:p-6 transition-all duration-300 ease-out"
        style={{ overflowAnchor: 'auto' }}
      >
        <EmptyState onSelectPrompt={onSelectPrompt || ((prompt) => onSendMessage(prompt))} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto flex flex-col divide-y divide-transparent transition-all duration-300 ease-out"
    >
      {sortedMessages.map((message, index) => {
        const isLast = index === sortedMessages.length - 1;
        return (
          <MessageItem
            key={message.id}
            message={message}
            isLast={isLast}
            streamContent={isLast && isLastAssistantGenerating ? displayedText : undefined}
            onSelectPrompt={onSelectPrompt}
            onRegenerate={
              isLast && message.role === 'assistant'
                ? () => {
                    const lastUserMsg = [...sortedMessages].reverse().find((m) => m.role === 'user');
                    if (lastUserMsg) onSendMessage(lastUserMsg.content);
                  }
                : undefined
            }
          />
        );
      })}
      {/* Invisible anchor element at the absolute bottom of the message list */}
      <div ref={messagesEndRef} className="h-4 w-full flex-shrink-0" aria-hidden="true" />
    </div>
  );
});
