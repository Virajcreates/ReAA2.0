'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message } from '@/types/chat';
import { generateId } from '@/lib/utils';
import { ReraNamespace } from '@/types/rera';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

const BASE_STORAGE_KEY = 'krera_chat_sessions_v1';
const BASE_ACTIVE_CONV_KEY = 'krera_active_conv_id_v1';

export function useChatSession(initialUser?: User | null) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const supabase = useRef(createClient()).current;

  // Track active user
  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser, supabase]);

  const storageKey = user ? `${BASE_STORAGE_KEY}_${user.id}` : BASE_STORAGE_KEY;
  const activeConvKey = user ? `${BASE_ACTIVE_CONV_KEY}_${user.id}` : BASE_ACTIVE_CONV_KEY;

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

  // Load conversations: First from local cache, then sync from Supabase
  useEffect(() => {
    let isCancelled = false;

    async function loadSessions() {
      // 1. Instant optimistic load from user-scoped localStorage
      try {
        const saved = localStorage.getItem(storageKey);
        const savedActiveId = localStorage.getItem(activeConvKey);

        if (saved) {
          const parsed: Conversation[] = JSON.parse(saved);
          if (!isCancelled) {
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
        }
      } catch (e) {
        console.warn('Failed to load local chat sessions cache:', e);
      } finally {
        if (!isCancelled) setIsLoaded(true);
      }

      // 2. Fetch authenticated user's consultations from Supabase
      if (!user) return;

      try {
        const { data: dbConsultations, error } = await supabase
          .from('consultations')
          .select('id, title, active_namespaces, created_at, updated_at, messages(*)')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.warn('Supabase consultations query notice:', error.message);
          return;
        }

        if (dbConsultations && !isCancelled) {
          const remoteConvs: Conversation[] = dbConsultations.map((c: any) => ({
            id: c.id,
            title: c.title,
            createdAt: new Date(c.created_at).getTime(),
            updatedAt: new Date(c.updated_at).getTime(),
            activeNamespaces: c.active_namespaces || [
              'rera-legal',
              'rera-litigation',
              'rera-complaints',
              'rera-projects',
            ],
            messages: (c.messages || [])
              .sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
              .map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.created_at).getTime(),
                routedNamespaces: m.routed_namespaces,
                citations: m.citations,
                status: m.status,
              })),
          }));

          setConversations(remoteConvs);
          conversationsRef.current = remoteConvs;

          try {
            localStorage.setItem(storageKey, JSON.stringify(remoteConvs));
          } catch (e) {
            console.warn('Failed to sync remote conversations to localStorage:', e);
          }

          if (remoteConvs.length > 0 && !activeIdRef.current) {
            setActiveConversationId(remoteConvs[0].id);
            activeIdRef.current = remoteConvs[0].id;
          }
        }
      } catch (err) {
        console.warn('Error fetching Supabase consultations:', err);
      }
    }

    loadSessions();

    return () => {
      isCancelled = true;
    };
  }, [user, storageKey, activeConvKey, supabase]);

  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up persist timer on unmount
  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, []);

  // Save conversations to localStorage
  const persistConversations = useCallback(
    (updated: Conversation[], immediate = false) => {
      if (immediate) {
        if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
        return;
      }

      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
      persistTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
      }, 400);
    },
    [storageKey]
  );

  // Set and persist active conversation ID
  const selectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      activeIdRef.current = id;
      try {
        localStorage.setItem(activeConvKey, id);
      } catch (e) {
        console.warn('Failed to save active id:', e);
      }
    },
    [activeConvKey]
  );

  // Create a brand new consultation idempotently
  const createNewConsultation = useCallback(
    (initialTitle = 'New Consultation', activeNamespaces?: ReraNamespace[]) => {
      const newId = generateId('conv');
      const now = Date.now();
      const newConv: Conversation = {
        id: newId,
        title: initialTitle,
        messages: [],
        createdAt: now,
        updatedAt: now,
        activeNamespaces: activeNamespaces || [
          'rera-legal',
          'rera-litigation',
          'rera-complaints',
          'rera-projects',
        ],
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
        localStorage.setItem(activeConvKey, newId);
      } catch (e) {
        console.warn('Failed to save active id:', e);
      }

      // Persist to Supabase if authenticated
      if (user) {
        supabase
          .from('consultations')
          .insert({
            id: newId,
            user_id: user.id,
            title: initialTitle,
            active_namespaces: newConv.activeNamespaces,
            created_at: new Date(now).toISOString(),
            updated_at: new Date(now).toISOString(),
          })
          .then(
            ({ error }) => {
              if (error) console.warn('Supabase insert consultation notice:', error.message);
            },
            (err: any) => console.warn('Supabase consultation insert error:', err)
          );
      }

      return newConv;
    },
    [persistConversations, activeConvKey, user, supabase]
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
            localStorage.setItem(activeConvKey, nextActive);
          } else {
            localStorage.removeItem(activeConvKey);
          }
        }
        return updated;
      });

      // Delete from Supabase
      if (user) {
        supabase
          .from('consultations')
          .delete()
          .eq('id', id)
          .then(
            ({ error }) => {
              if (error) console.warn('Supabase delete consultation notice:', error.message);
            },
            (err: any) => console.warn('Supabase consultation delete error:', err)
          );
      }
    },
    [persistConversations, activeConvKey, user, supabase]
  );

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    setConversations([]);
    conversationsRef.current = [];
    activeIdRef.current = null;
    setActiveConversationId(null);
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(activeConvKey);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }

    // Clear user's consultations in Supabase
    if (user) {
      supabase
        .from('consultations')
        .delete()
        .eq('user_id', user.id)
        .then(
          ({ error }) => {
            if (error) console.warn('Supabase clear consultations notice:', error.message);
          },
          (err: any) => console.warn('Supabase clear consultations error:', err)
        );
    }
  }, [storageKey, activeConvKey, user, supabase]);

  // Rename a conversation
  const renameConversation = useCallback(
    (id: string, newTitle: string) => {
      const now = Date.now();
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, title: newTitle, updatedAt: now } : c
        );
        conversationsRef.current = updated;
        persistConversations(updated);
        return updated;
      });

      // Update in Supabase
      if (user) {
        supabase
          .from('consultations')
          .update({ title: newTitle, updated_at: new Date(now).toISOString() })
          .eq('id', id)
          .then(
            ({ error }) => {
              if (error) console.warn('Supabase rename consultation notice:', error.message);
            },
            (err: any) => console.warn('Supabase rename consultation error:', err)
          );
      }
    },
    [persistConversations, user, supabase]
  );

  // Append a message to a specific conversation ID
  const addMessageToConversation = useCallback(
    (convId: string, message: Message) => {
      let currentTitle = 'New Consultation';

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === convId);
        let updatedConvs: Conversation[];

        if (!exists) {
          currentTitle =
            message.role === 'user'
              ? message.content.slice(0, 35) || 'New Consultation'
              : 'New Consultation';
          const newConv: Conversation = {
            id: convId,
            title: currentTitle,
            messages: [message],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            activeNamespaces: [
              'rera-legal',
              'rera-litigation',
              'rera-complaints',
              'rera-projects',
            ],
          };
          updatedConvs = [newConv, ...prev];
        } else {
          updatedConvs = prev.map((c) => {
            if (c.id === convId) {
              let title = c.title;
              if (c.title === 'New Consultation' && message.role === 'user') {
                title = message.content.slice(0, 35) + (message.content.length > 35 ? '...' : '');
              }
              currentTitle = title;
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

      // Persist to Supabase if authenticated
      if (user) {
        // Ensure consultation exists/upserted
        supabase
          .from('consultations')
          .upsert({
            id: convId,
            user_id: user.id,
            title: currentTitle,
            updated_at: new Date().toISOString(),
          })
          .then(
            () => {
              return supabase.from('messages').upsert({
                id: message.id,
                consultation_id: convId,
                user_id: user.id,
                role: message.role,
                content: message.content,
                routed_namespaces: message.routedNamespaces || [],
                citations: message.citations || [],
                status: message.status || 'done',
                created_at: new Date(message.timestamp).toISOString(),
              });
            },
            (err: any) => console.warn('Supabase message persist notice:', err)
          );
      }
    },
    [persistConversations, user, supabase]
  );

  // Update a specific message in a conversation
  const updateMessageInConversation = useCallback(
    (convId: string, messageId: string, updater: (prev: Message) => Message) => {
      let updatedTargetMsg: Message | null = null;

      setConversations((prev) => {
        const updatedConvs = prev.map((conv) => {
          if (conv.id === convId) {
            const updatedMessages = conv.messages.map((m) => {
              if (m.id === messageId) {
                const res = updater(m);
                updatedTargetMsg = res;
                return res;
              }
              return m;
            });
            return {
              ...conv,
              messages: updatedMessages,
              updatedAt: Date.now(),
            };
          }
          return conv;
        });

        conversationsRef.current = updatedConvs;
        const isFinished = updatedConvs.some(
          (c) =>
            c.id === convId &&
            c.messages.some(
              (m) => m.id === messageId && (m.status === 'done' || m.status === 'error')
            )
        );
        persistConversations(updatedConvs, isFinished);
        return updatedConvs;
      });

      // Sync final streaming state to Supabase
      if (user && updatedTargetMsg) {
        const msg = updatedTargetMsg as Message;
        if (msg.status === 'done' || msg.status === 'error') {
          supabase
            .from('messages')
            .update({
              content: msg.content,
              status: msg.status,
              citations: msg.citations || [],
              routed_namespaces: msg.routedNamespaces || [],
            })
            .eq('id', messageId)
            .then(
              ({ error }) => {
                if (error) console.warn('Supabase message update notice:', error.message);
              },
              (err: any) => console.warn('Supabase message update error:', err)
            );
        }
      }
    },
    [persistConversations, user, supabase]
  );

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return {
    user,
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
