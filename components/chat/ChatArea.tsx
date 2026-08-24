'use client';

import React, { useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { MessageItem } from './MessageItem';
import { EmptyState } from './EmptyState';
import { ReraNamespace } from '@/types/rera';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string, namespaces?: ReraNamespace[]) => void;
  isStreaming: boolean;
}

export function ChatArea({ messages, onSendMessage, isStreaming }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
        <EmptyState onSelectPrompt={(prompt) => onSendMessage(prompt)} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-transparent">
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
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
