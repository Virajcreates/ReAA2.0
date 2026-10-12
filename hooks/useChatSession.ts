'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message } from '@/types/chat';
import { generateId, extractSuggestionsFromContent } from '@/lib/utils';
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
          const remoteConvs: Conversation[] = dbConsultations.map((c: any) => {
            const localConv = conversationsRef.current.find((lc) => lc.id === c.id);

            const mappedMessages = (c.messages || [])
              .sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
              .map((m: any) => {
                // Find matching local message to guard against overwriting non-empty local text with empty DB records
                const localMsg = localConv?.messages.find((lm) => lm.id === m.id);

                const resolvedContent =
                  (m.content && m.content.trim().length > 0 ? m.content : null) ||
                  (m.text && m.text.trim().length > 0 ? m.text : null) ||
                  (m.response && m.response.trim().length > 0 ? m.response : null) ||
                  (m.message && m.message.trim().length > 0 ? m.message : null) ||
                  (m.parts?.find((p: any) => p.type === 'text')?.text) ||
                  (localMsg?.content && localMsg.content.trim().length > 0 ? localMsg.content : '') ||
                  '';

                // Historical messages retrieved from DB should be marked 'done' unless explicitly an error
                const resolvedStatus =
                  m.status === 'error' || localMsg?.status === 'error'
                    ? 'error'
                    : 'done';

                const { cleanContent, suggestions: parsedSuggestions } =
                  extractSuggestionsFromContent(resolvedContent);

                const resolvedSuggestions =
                  m.suggestions ||
                  localMsg?.suggestions ||
                  (parsedSuggestions.length > 0 ? parsedSuggestions : undefined);

                return {
                  id: m.id,
                  role: m.role,
                  content: cleanContent,
                  timestamp: new Date(m.created_at || m.timestamp || Date.now()).getTime(),
                  routedNamespaces: m.routed_namespaces || m.routedNamespaces || localMsg?.routedNamespaces || [],
                  citations: m.citations || localMsg?.citations || [],
                  suggestions: resolvedSuggestions,
                  status: resolvedStatus,
                  attachments: m.attachments || localMsg?.attachments,
                  fileName: m.file_name || m.fileName || localMsg?.fileName,
                  fileUrl: m.file_url || m.fileUrl || localMsg?.fileUrl,
                };
              });

            // Preserve local-only messages (in-flight optimistic assistant placeholder or pending user message)
            const localOnlyMessages = (localConv?.messages || []).filter(
              (lm: Message) => !mappedMessages.some((rm: Message) => rm.id === lm.id)
            );
            const mergedMessages: Message[] = [...mappedMessages, ...localOnlyMessages].sort(
              (a: Message, b: Message) => (a.timestamp || 0) - (b.timestamp || 0)
            );

            return {
              id: c.id,
              title: c.title || localConv?.title || 'New Consultation',
              createdAt: new Date(c.created_at).getTime(),
              updatedAt: new Date(c.updated_at).getTime(),
              activeNamespaces: c.active_namespaces || localConv?.activeNamespaces || [
                'rera-legal',
                'rera-litigation',
                'rera-complaints',
                'rera-projects',
              ],
              messages: mergedMessages,
            };
          });

          // Preserve any local consultations that are not yet in remote response
          const unsyncedLocalConvs = conversationsRef.current.filter(
            (lc) => !remoteConvs.some((rc) => rc.id === lc.id)
          );
          const mergedConvs = [...unsyncedLocalConvs, ...remoteConvs].sort(
            (a, b) => b.updatedAt - a.updatedAt
          );

          setConversations(mergedConvs);
          conversationsRef.current = mergedConvs;

          try {
            localStorage.setItem(storageKey, JSON.stringify(mergedConvs));
          } catch (e) {
            console.warn('Failed to sync remote conversations to localStorage:', e);
          }

          if (mergedConvs.length > 0 && !activeIdRef.current) {
            setActiveConversationId(mergedConvs[0].id);
            activeIdRef.current = mergedConvs[0].id;
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
        persistConversations(updated, true);
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
      // 1. Determine title generation synchronously from ref
      const existingConv = conversationsRef.current.find((c) => c.id === convId);
      let generatedTitle: string | null = null;

      if (!existingConv && message.role === 'user') {
        const cleanText = message.content.trim();
        generatedTitle =
          cleanText.slice(0, 35) + (cleanText.length > 35 ? '...' : '') || 'New Consultation';
      } else if (
        existingConv &&
        (existingConv.title === 'New Consultation' || !existingConv.title) &&
        message.role === 'user'
      ) {
        const cleanText = message.content.trim();
        if (cleanText) {
          generatedTitle = cleanText.slice(0, 35) + (cleanText.length > 35 ? '...' : '');
        }
      }

      const hasTitleChanged = Boolean(generatedTitle && generatedTitle !== 'New Consultation');

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === convId);
        let updatedConvs: Conversation[];

        if (!exists) {
          const newConv: Conversation = {
            id: convId,
            title: generatedTitle || 'New Consultation',
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
              const updatedTitle = generatedTitle || c.title;
              return {
                ...c,
                title: updatedTitle,
                messages: [...c.messages, message],
                updatedAt: Date.now(),
              };
            }
            return c;
          });
        }

        conversationsRef.current = updatedConvs;
        persistConversations(updatedConvs, hasTitleChanged);
        return updatedConvs;
      });

      // 2. Persist to Supabase if authenticated
      if (user) {
        const nowIso = new Date().toISOString();

        if (hasTitleChanged && generatedTitle) {
          // Explicitly update title in Supabase
          supabase
            .from('consultations')
            .update({
              title: generatedTitle,
              updated_at: nowIso,
            })
            .eq('id', convId)
            .then(
              ({ error }) => {
                if (error) console.warn('Supabase consultation title update notice:', error.message);
              },
              (err: any) => console.warn('Supabase consultation title update error:', err)
            );
        }

        // Ensure consultation row exists and updated_at is refreshed
        const shouldPersistMsg =
          message.role === 'user' || Boolean(message.content && message.content.trim().length > 0);

        if (!existingConv) {
          supabase
            .from('consultations')
            .upsert({
              id: convId,
              user_id: user.id,
              title: generatedTitle || 'New Consultation',
              updated_at: nowIso,
            })
            .then(
              () => {
                if (shouldPersistMsg) {
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
                }
              },
              (err: any) => console.warn('Supabase message persist notice:', err)
            );
        } else {
          // If consultation already exists, update updated_at without overwriting custom titles
          const updatePayload: { updated_at: string; title?: string } = {
            updated_at: nowIso,
          };
          if (hasTitleChanged && generatedTitle) {
            updatePayload.title = generatedTitle;
          }

          supabase
            .from('consultations')
            .update(updatePayload)
            .eq('id', convId)
            .then(
              () => {
                if (shouldPersistMsg) {
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
                }
              },
              (err: any) => console.warn('Supabase message persist notice:', err)
            );
        }
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
            const exists = conv.messages.some((m) => m.id === messageId);
            let updatedMessages: Message[];

            if (exists) {
              updatedMessages = conv.messages.map((m) => {
                if (m.id === messageId) {
                  const res = updater(m);
                  updatedTargetMsg = res;
                  return res;
                }
                return m;
              });
            } else {
              // Placeholder was missing or dropped; recreate and append it immediately
              const placeholderMsg: Message = {
                id: messageId,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                status: 'routing',
              };
              const res = updater(placeholderMsg);
              updatedTargetMsg = res;
              updatedMessages = [...conv.messages, res];
            }

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

      // Sync final streaming state to Supabase using reliable target check
      const targetMsgToPersist: Message | undefined =
        updatedTargetMsg ||
        conversationsRef.current
          .find((c) => c.id === convId)
          ?.messages.find((m) => m.id === messageId);

      if (user && targetMsgToPersist) {
        const msg = targetMsgToPersist;
        if (msg.status === 'done' || msg.status === 'error') {
          if (msg.content && msg.content.trim().length > 0) {
            const contentToPersist =
              msg.suggestions && msg.suggestions.length > 0 && !msg.content.includes('<!--SUGGESTIONS')
                ? `${msg.content}\n\n<!--SUGGESTIONS:${JSON.stringify(msg.suggestions)}-->`
                : msg.content;

            supabase
              .from('messages')
              .upsert({
                id: messageId,
                consultation_id: convId,
                user_id: user.id,
                role: msg.role,
                content: contentToPersist,
                status: msg.status,
                citations: msg.citations || [],
                routed_namespaces: msg.routedNamespaces || [],
                created_at: new Date(msg.timestamp || Date.now()).toISOString(),
              })
              .then(
                ({ error }) => {
                  if (error) console.warn('Supabase message update notice:', error.message);
                },
                (err: any) => console.warn('Supabase message update error:', err)
              );
          }
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
