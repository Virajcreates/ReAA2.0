'use client';

import React, { useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { MessageItem } from './MessageItem';
import { EmptyState } from './EmptyState';
import { ReraNamespace } from '@/types/rera';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string, namespaces?: ReraNamespace[], language?: string) => void;
  isStreaming: boolean;
}

export const ChatArea = React.memo(function ChatArea({
  messages,
  onSendMessage,
  isStreaming,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Smooth Auto-Scrolling anchored to the bottom ref on message stream updates
  useEffect(() => {
    if (!messagesEndRef.current) return;

    // Use requestAnimationFrame to coordinate smooth scrolling with the browser's paint cycle
    const animId = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    });

    return () => cancelAnimationFrame(animId);
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 overflow-y-auto [overflow-anchor:auto] flex items-center justify-center p-4 transition-all duration-300 ease-out"
        style={{ overflowAnchor: 'auto' }}
      >
        <EmptyState onSelectPrompt={(prompt) => onSendMessage(prompt)} />
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto [overflow-anchor:auto] divide-y divide-transparent scroll-smooth transition-all duration-300 ease-out"
      style={{ overflowAnchor: 'auto' }}
    >
      {messages.map((message, index) => (
        <MessageItem
          key={message.id || index}
          message={message}
          onRegenerate={
            index === messages.length - 1 && message.role === 'assistant'
              ? () => {
                  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUserMsg) onSendMessage(lastUserMsg.content);
                }
              : undefined
          }
        />
      ))}
      {/* Scroll anchoring target ref at the bottom */}
      <div ref={messagesEndRef} className="h-4 w-full flex-shrink-0" />
    </div>
  );
});
