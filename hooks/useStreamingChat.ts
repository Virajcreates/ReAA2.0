'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Message, StreamStatus } from '@/types/chat';
import { ReraNamespace } from '@/types/rera';
import { generateId } from '@/lib/utils';

interface UseStreamingChatProps {
  activeConversationId: string | null;
  activeIdRef: React.MutableRefObject<string | null>;
  messages: Message[];
  addMessageToConversation: (convId: string, msg: Message) => void;
  updateMessageInConversation: (convId: string, id: string, updater: (prev: Message) => Message) => void;
  createNewConsultation: (initialTitle?: string, namespaces?: ReraNamespace[]) => any;
}

export function useStreamingChat({
  activeConversationId,
  activeIdRef,
  messages,
  addMessageToConversation,
  updateMessageInConversation,
  createNewConsultation,
}: UseStreamingChatProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const [streamError, setStreamError] = useState<string | null>(null);

  const isSubmittingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    setIsStreaming(false);
    setStatusText('');
  }, []);

  const sendMessage = useCallback(
    async (content: string, selectedNamespaces?: ReraNamespace[]) => {
      const cleanContent = content.trim();
      if (!cleanContent) return;

      // Strict lock: Prevent double-execution
      if (isSubmittingRef.current || isStreaming) {
        console.warn('Query submission blocked: stream already in progress.');
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setStreamError(null);

      // 1. Resolve exact target conversation ID synchronously
      const convId: string =
        activeIdRef.current ||
        activeConversationId ||
        createNewConsultation(cleanContent.slice(0, 35) || 'New Consultation', selectedNamespaces).id;

      // 2. Create and add User Message
      const userMessageId = generateId('user');
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: cleanContent,
        timestamp: Date.now(),
        status: 'done',
      };
      addMessageToConversation(convId, userMessage);

      // 3. Create placeholder Assistant Message
      const assistantMessageId = generateId('asst');
      const initialAssistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'routing',
        citations: [],
        routedNamespaces: [],
      };
      addMessageToConversation(convId, initialAssistantMessage);

      setIsStreaming(true);
      setStatusText('Analyzing query and consulting K-RERA database...');

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const historyForApi = messages
          .concat(userMessage)
          .map((m) => ({ role: m.role, content: m.content }))
          .filter((m) => m.role === 'user' || m.role === 'assistant');

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: historyForApi,
            conversationId: convId,
            namespaces: selectedNamespaces,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorJson = await response.json().catch(() => ({}));
          throw new Error(errorJson.message || errorJson.error || `HTTP error ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body returned from chat stream.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;

            let eventType = 'token';
            let eventData: any = {};

            const blockLines = block.split('\n');
            for (const line of blockLines) {
              if (line.startsWith('event: ')) {
                eventType = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                const rawData = line.replace('data: ', '').trim();
                try {
                  eventData = JSON.parse(rawData);
                } catch {
                  eventData = { text: rawData };
                }
              }
            }

            // Check for error payload in either event type or JSON data structure
            const isErrorEvent =
              eventType === 'error' ||
              eventData?.type === 'error' ||
              Boolean(eventData?.error);

            if (isErrorEvent) {
              const errorMessage =
                eventData?.message || eventData?.error || 'A streaming error occurred.';
              console.error('SSE Error Event received:', errorMessage);

              updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                ...prev,
                status: 'error',
                error: errorMessage,
              }));
              setStreamError(errorMessage);
              setStatusText('');
              continue;
            }

            // Process Standard SSE Events
            if (eventType === 'status') {
              if (eventData.statusText) {
                setStatusText(eventData.statusText);
              }
            } else if (eventType === 'routing') {
              updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                ...prev,
                status: 'retrieving',
                routedNamespaces: eventData.routedNamespaces || [],
              }));
              setStatusText(`Retrieving from namespaces: ${(eventData.routedNamespaces || []).join(', ')}`);
            } else if (eventType === 'citations') {
              updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                ...prev,
                citations: eventData.citations || [],
              }));
            } else if (eventType === 'token') {
              const chunk = eventData.text || '';
              updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                ...prev,
                status: 'generating',
                content: prev.content + chunk,
              }));
              setStatusText('');
            } else if (eventType === 'done') {
              updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                ...prev,
                status: 'done',
              }));
            }
          }
        }

        // Finalize status to done if not in error state
        updateMessageInConversation(convId, assistantMessageId, (prev) => {
          if (prev.status !== 'error') {
            return { ...prev, status: 'done' };
          }
          return prev;
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Stream generation aborted by user.');
        } else {
          console.error('Streaming request failed:', err);
          const errorMsg = err.message || 'Failed to complete query. Please try again.';
          setStreamError(errorMsg);
          updateMessageInConversation(convId, assistantMessageId, (prev) => ({
            ...prev,
            status: 'error',
            error: errorMsg,
          }));
        }
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        setIsStreaming(false);
        setStatusText('');
        abortControllerRef.current = null;
      }
    },
    [
      activeConversationId,
      activeIdRef,
      messages,
      isStreaming,
      addMessageToConversation,
      updateMessageInConversation,
      createNewConsultation,
    ]
  );

  return {
    sendMessage,
    stopGeneration,
    isStreaming,
    isSubmitting,
    statusText,
    streamError,
  };
}
