'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message } from '@/types/chat';
import { generateId } from '@/lib/utils';
import { ReraNamespace } from '@/types/rera';

const STORAGE_KEY = 'krera_chat_sessions_v1';
const ACTIVE_CONV_KEY = 'krera_active_conv_id_v1';

export function useChatSession() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Synchronous ref to prevent React StrictMode double-creation race conditions
  const activeIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  // Keep refs synchronized
  useEffect(() => {
    activeIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedActiveId = localStorage.getItem(ACTIVE_CONV_KEY);

      if (saved) {
        const parsed: Conversation[] = JSON.parse(saved);
        setConversations(parsed);
        conversationsRef.current = parsed;

        if (savedActiveId && parsed.some((c) => c.id === savedActiveId)) {
          setActiveConversationId(savedActiveId);
          activeIdRef.current = savedActiveId;
        } else if (parsed.length > 0) {
          setActiveConversationId(parsed[0].id);
          activeIdRef.current = parsed[0].id;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save conversations to localStorage
  const persistConversations = useCallback((updated: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, []);

  // Set and persist active conversation ID
  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    activeIdRef.current = id;
    try {
      localStorage.setItem(ACTIVE_CONV_KEY, id);
    } catch (e) {
      console.warn('Failed to save active id:', e);
    }
  }, []);

  // Create a brand new consultation idempotently
  const createNewConsultation = useCallback(
    (initialTitle = 'New Consultation', activeNamespaces?: ReraNamespace[]) => {
      const newId = generateId('conv');
      const newConv: Conversation = {
        id: newId,
        title: initialTitle,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activeNamespaces: activeNamespaces || ['rera-legal', 'rera-litigation', 'rera-complaints', 'rera-projects'],
      };

      activeIdRef.current = newId;
      setActiveConversationId(newId);

      setConversations((prev) => {
        const updated = [newConv, ...prev.filter((c) => c.id !== newId)];
        conversationsRef.current = updated;
        persistConversations(updated);
        return updated;
      });

      try {
        localStorage.setItem(ACTIVE_CONV_KEY, newId);
      } catch (e) {
        console.warn('Failed to save active id:', e);
      }

      return newConv;
    },
    [persistConversations]
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        conversationsRef.current = updated;
        persistConversations(updated);

        if (activeIdRef.current === id) {
          const nextActive = updated.length > 0 ? updated[0].id : null;
          activeIdRef.current = nextActive;
          setActiveConversationId(nextActive);
          if (nextActive) {
            localStorage.setItem(ACTIVE_CONV_KEY, nextActive);
          } else {
            localStorage.removeItem(ACTIVE_CONV_KEY);
          }
        }
        return updated;
      });
    },
    [persistConversations]
  );

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    setConversations([]);
    conversationsRef.current = [];
    activeIdRef.current = null;
    setActiveConversationId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_CONV_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  }, []);

  // Rename a conversation
  const renameConversation = useCallback(
    (id: string, newTitle: string) => {
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c
        );
        conversationsRef.current = updated;
        persistConversations(updated);
        return updated;
      });
    },
    [persistConversations]
  );

  // Append a message to a specific conversation ID (guaranteed single session)
  const addMessageToConversation = useCallback(
    (convId: string, message: Message) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === convId);
        let updatedConvs: Conversation[];

        if (!exists) {
          // If conversation doesn't exist yet, create it with this message
          const newConv: Conversation = {
            id: convId,
            title: message.role === 'user' ? (message.content.slice(0, 35) || 'New Consultation') : 'New Consultation',
            messages: [message],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            activeNamespaces: ['rera-legal', 'rera-litigation', 'rera-complaints', 'rera-projects'],
          };
          updatedConvs = [newConv, ...prev];
        } else {
          updatedConvs = prev.map((c) => {
            if (c.id === convId) {
              let title = c.title;
              if (c.title === 'New Consultation' && message.role === 'user') {
                title = message.content.slice(0, 35) + (message.content.length > 35 ? '...' : '');
              }
              return {
                ...c,
                title,
                messages: [...c.messages, message],
                updatedAt: Date.now(),
              };
            }
            return c;
          });
        }

        conversationsRef.current = updatedConvs;
        persistConversations(updatedConvs);
        return updatedConvs;
      });
    },
    [persistConversations]
  );

  // Update a specific message in a conversation
  const updateMessageInConversation = useCallback(
    (convId: string, messageId: string, updater: (prev: Message) => Message) => {
      setConversations((prev) => {
        const updatedConvs = prev.map((conv) => {
          if (conv.id === convId) {
            const updatedMessages = conv.messages.map((m) =>
              m.id === messageId ? updater(m) : m
            );
            return {
              ...conv,
              messages: updatedMessages,
              updatedAt: Date.now(),
            };
          }
          return conv;
        });

        conversationsRef.current = updatedConvs;
        persistConversations(updatedConvs);
        return updatedConvs;
      });
    },
    [persistConversations]
  );

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return {
    conversations,
    activeConversation,
    activeConversationId,
    activeIdRef,
    isLoaded,
    selectConversation,
    createNewConsultation,
    deleteConversation,
    clearAllConversations,
    renameConversation,
    addMessageToConversation,
    updateMessageInConversation,
  };
}
