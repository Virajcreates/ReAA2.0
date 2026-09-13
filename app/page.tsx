'use client';

import React, { useState, useEffect } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Restore sidebar state from localStorage on mount (prevents SSR hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('reaa_sidebar_open');
      if (stored !== null) {
        setIsSidebarOpen(stored === 'true');
      } else if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    } catch (e) {
      console.warn('Failed to read sidebar preference from localStorage:', e);
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('reaa_sidebar_open', String(next));
      } catch (e) {
        console.warn('Failed to save sidebar preference to localStorage:', e);
      }
      return next;
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    try {
      localStorage.setItem('reaa_sidebar_open', 'false');
    } catch (e) {
      console.warn('Failed to save sidebar preference to localStorage:', e);
    }
  };

  const {
    user,
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
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans">
      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewConsultation={createNewConsultation}
        onDeleteConversation={deleteConversation}
        onClearAll={clearAllConversations}
        onRenameConversation={renameConversation}
        user={user}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 w-full min-w-0 flex flex-col h-screen overflow-hidden bg-black">
        {/* Top Header */}
        <Header
          onToggleSidebar={handleToggleSidebar}
          onNewConsultation={createNewConsultation}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Chat Feed Area */}
        <main className="flex-1 w-full min-w-0 flex flex-col min-h-0 overflow-hidden relative bg-black">
          <ChatArea
            messages={messages}
            onSendMessage={sendMessage}
            isStreaming={isStreaming}
          />
        </main>

        {/* Floating Input Bar */}
        <footer className="w-full flex-shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-xl pt-2 border-t border-white/10">
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
