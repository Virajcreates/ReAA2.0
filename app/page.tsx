'use client';

import React, { useState } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    activeIdRef,
    selectConversation,
    createNewConsultation,
    deleteConversation,
    clearAllConversations,
    renameConversation,
    addMessageToConversation,
    updateMessageInConversation,
  } = useChatSession();

  const messages = activeConversation?.messages || [];

  const {
    sendMessage,
    stopGeneration,
    isStreaming,
    isSubmitting,
    statusText,
  } = useStreamingChat({
    activeConversationId,
    activeIdRef,
    messages,
    addMessageToConversation,
    updateMessageInConversation,
    createNewConsultation,
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100">
      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewConsultation={createNewConsultation}
        onDeleteConversation={deleteConversation}
        onClearAll={clearAllConversations}
        onRenameConversation={renameConversation}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-[#0b0f19]">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onNewConsultation={createNewConsultation}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Chat Feed Area */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <ChatArea
            messages={messages}
            onSendMessage={sendMessage}
            isStreaming={isStreaming}
          />
        </main>

        {/* Floating Input Bar */}
        <footer className="w-full bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/90 to-transparent backdrop-blur-xl pt-2 border-t border-slate-800/40">
          <ChatInput
            onSendMessage={sendMessage}
            onStop={stopGeneration}
            isStreaming={isStreaming}
            isSubmitting={isSubmitting}
            statusText={statusText}
          />
        </footer>
      </div>
    </div>
  );
}
