'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Message, StreamStatus } from '@/types/chat';
import { ReraNamespace } from '@/types/rera';
import { generateId, extractSuggestionsFromContent } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface UseStreamingChatProps {
  activeConversationId: string | null;
  activeIdRef: React.MutableRefObject<string | null>;
  messages: Message[];
  addMessageToConversation: (convId: string, msg: Message) => void;
  updateMessageInConversation: (convId: string, id: string, updater: (prev: Message) => Message) => void;
  createNewConsultation: (initialTitle?: string, namespaces?: ReraNamespace[]) => any;
  user?: User | null;
}

export function useStreamingChat({
  activeConversationId,
  activeIdRef,
  messages,
  addMessageToConversation,
  updateMessageInConversation,
  createNewConsultation,
  user,
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
    async (
      content: string,
      selectedNamespaces?: ReraNamespace[],
      language: string = 'en-IN',
      file?: File | File[] | null
    ) => {
      const cleanContent = content.trim();
      const fileList: File[] = Array.isArray(file)
        ? file
        : file
        ? [file]
        : [];

      if (!cleanContent && fileList.length === 0) return;

      // Strict lock: Prevent double-execution
      if (isSubmittingRef.current || isStreaming) {
        console.warn('Query submission blocked: stream already in progress.');
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setStreamError(null);

      // 1. Resolve exact target conversation ID synchronously
      const defaultTitle =
        cleanContent.slice(0, 35) ||
        (fileList.length > 0
          ? fileList.length === 1
            ? `PDF: ${fileList[0].name.slice(0, 20)}`
            : `PDFs (${fileList.length}): ${fileList[0].name.slice(0, 15)}...`
          : 'New Consultation');

      const convId: string =
        activeIdRef.current ||
        activeConversationId ||
        createNewConsultation(defaultTitle, selectedNamespaces).id;

      // 2. Upload file(s) to Supabase storage 'temp_documents' bucket if provided
      let fileUrl: string | undefined = undefined;
      if (fileList.length > 0) {
        setStatusText(
          fileList.length === 1
            ? 'Uploading temporary PDF document to secure storage...'
            : `Uploading ${fileList.length} temporary PDF documents to secure storage...`
        );

        const uploadedUrls: string[] = [];
        const supabase = createClient();

        for (const f of fileList) {
          const fileExt = f.name.split('.').pop() || 'pdf';
          const cleanBaseName = f.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
          const fileName = `${Date.now()}_${cleanBaseName}.${fileExt}`;
          let currentUrl: string | undefined = undefined;

          try {
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('temp_documents')
              .upload(fileName, f, { cacheControl: '3600', upsert: true });

            if (!uploadError && uploadData) {
              const { data: pubData } = supabase.storage
                .from('temp_documents')
                .getPublicUrl(uploadData.path || fileName);
              currentUrl = pubData?.publicUrl;

              if (!currentUrl) {
                const { data: signedData } = await supabase.storage
                  .from('temp_documents')
                  .createSignedUrl(uploadData.path || fileName, 3600);
                currentUrl = signedData?.signedUrl;
              }
            } else {
              console.warn('Direct client upload issue, falling back to server upload route:', uploadError?.message);
              const formData = new FormData();
              formData.append('file', f);
              formData.append('fileName', fileName);
              const fallbackRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              if (fallbackRes.ok) {
                const json = await fallbackRes.json();
                currentUrl = json.fileUrl;
              } else {
                throw new Error(uploadError?.message || 'Storage upload failed.');
              }
            }
          } catch (uploadErr: any) {
            console.error('PDF upload encountered error, executing server-side upload fallback:', uploadErr);
            try {
              const formData = new FormData();
              formData.append('file', f);
              formData.append('fileName', fileName);
              const fallbackRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              if (fallbackRes.ok) {
                const json = await fallbackRes.json();
                currentUrl = json.fileUrl;
              } else {
                throw new Error(`Upload fallback failed: ${uploadErr.message}`);
              }
            } catch (finalErr: any) {
              console.error('All upload attempts failed for file:', f.name, finalErr);
            }
          }

          if (currentUrl) {
            uploadedUrls.push(currentUrl);
          }
        }

        if (uploadedUrls.length > 0) {
          fileUrl = uploadedUrls[0];
        } else {
          setStreamError('Failed to upload PDF documents.');
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Create and add User Message
      const userMessageId = generateId('user');
      const fileNamesStr = fileList.map((f) => f.name).join(', ');
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content:
          cleanContent ||
          (fileList.length > 0
            ? `[Attached ${fileList.length > 1 ? `${fileList.length} PDFs` : 'PDF'} for analysis: ${fileNamesStr}]`
            : ''),
        timestamp: Date.now(),
        status: 'done',
        fileName: fileList.length > 0 ? fileNamesStr : undefined,
        attachments: fileList.map((f) => ({
          name: f.name,
          size: f.size,
        })),
        fileUrl: fileUrl,
      };
      addMessageToConversation(convId, userMessage);

      // 4. Create placeholder Assistant Message
      const assistantMessageId = generateId('asst');
      const initialAssistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now() + 1,
        status: 'routing',
        citations: [],
        routedNamespaces: [],
        suggestions: [],
      };
      addMessageToConversation(convId, initialAssistantMessage);

      setIsStreaming(true);
      setStatusText(
        fileUrl
          ? fileList.length > 1
            ? `Analyzing ${fileList.length} PDF documents with Gemini 3.5 Flash...`
            : 'Analyzing PDF contents with Gemini 3.5 Flash...'
          : 'Analyzing query and consulting K-RERA database...'
      );

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const historyForApi = messages
          .concat(userMessage)
          .map((m) => ({ role: m.role, content: m.content }))
          .filter((m) => m.role === 'user' || m.role === 'assistant');

        let requestBody: BodyInit;
        let requestHeaders: Record<string, string> | undefined = undefined;

        if (fileList.length > 0) {
          const formData = new FormData();
          formData.append('message', cleanContent);
          formData.append('messages', JSON.stringify(historyForApi));
          formData.append('language', language || 'en-IN');
          if (selectedNamespaces && selectedNamespaces.length > 0) {
            formData.append('namespaces', JSON.stringify(selectedNamespaces));
          }
          formData.append('conversationId', convId);
          if (fileUrl) {
            formData.append('fileUrl', fileUrl);
          }

          fileList.forEach((file) => {
            formData.append('files', file);
          });

          requestBody = formData;
        } else {
          requestHeaders = {
            'Content-Type': 'application/json',
          };
          requestBody = JSON.stringify({
            messages: historyForApi,
            message: cleanContent,
            fileUrl: fileUrl,
            conversationId: convId,
            namespaces: selectedNamespaces,
            language: language || 'en-IN',
          });
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody,
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
        let accumulatedText = '';
        let accumulatedCitations: any[] = [];
        let accumulatedNamespaces: any[] = [];
        let accumulatedSuggestions: string[] = [];

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
              accumulatedNamespaces = eventData.routedNamespaces || [];
              updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                ...prev,
                status: 'retrieving',
                routedNamespaces: accumulatedNamespaces,
              }));
              setStatusText(`Retrieving from namespaces: ${accumulatedNamespaces.join(', ')}`);
            } else if (eventType === 'citations') {
              accumulatedCitations = eventData.citations || [];
              updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                ...prev,
                citations: accumulatedCitations,
              }));
            } else if (eventType === 'suggestions') {
              accumulatedSuggestions = eventData.suggestions || [];
              updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                ...prev,
                suggestions: accumulatedSuggestions,
              }));
            } else if (eventType === 'token') {
              const chunk = eventData.text || '';
              if (chunk) {
                accumulatedText += chunk;
                const { cleanContent: cleanStreamText, suggestions } = extractSuggestionsFromContent(accumulatedText);
                if (suggestions.length > 0 && accumulatedSuggestions.length === 0) {
                  accumulatedSuggestions = suggestions;
                }
                updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                  ...prev,
                  status: 'generating',
                  content: cleanStreamText,
                  suggestions: accumulatedSuggestions.length > 0 ? accumulatedSuggestions : prev.suggestions,
                }));
                setStatusText('');
              }
            } else if (eventType === 'done') {
              const { cleanContent: cleanDoneText, suggestions } = extractSuggestionsFromContent(accumulatedText);
              const finalSuggestions = accumulatedSuggestions.length > 0 ? accumulatedSuggestions : suggestions;
              updateMessageInConversation(convId, assistantMessageId, (prev) => ({
                ...prev,
                content: cleanDoneText.trim() ? cleanDoneText : prev.content,
                citations: accumulatedCitations.length > 0 ? accumulatedCitations : prev.citations,
                routedNamespaces: accumulatedNamespaces.length > 0 ? accumulatedNamespaces : prev.routedNamespaces,
                suggestions: finalSuggestions.length > 0 ? finalSuggestions : prev.suggestions,
                status: 'done',
              }));
            }
          }
        }

        // Finalize status to done with accumulatedText if not in error state
        const { cleanContent: cleanFinalText, suggestions } = extractSuggestionsFromContent(accumulatedText);
        const finalSuggestions = accumulatedSuggestions.length > 0 ? accumulatedSuggestions : suggestions;
        const finalContent = cleanFinalText.trim() || undefined;

        updateMessageInConversation(convId, assistantMessageId, (prev) => {
          if (prev.status !== 'error') {
            return {
              ...prev,
              content: finalContent || prev.content,
              citations: accumulatedCitations.length > 0 ? accumulatedCitations : prev.citations,
              routedNamespaces: accumulatedNamespaces.length > 0 ? accumulatedNamespaces : prev.routedNamespaces,
              suggestions: finalSuggestions.length > 0 ? finalSuggestions : prev.suggestions,
              status: 'done',
            };
          }
          return prev;
        });

        // Direct database upsert to guarantee Supabase stores the completed content with suggestions
        if (user && finalContent) {
          try {
            const supabase = createClient();
            const contentToPersist =
              finalSuggestions.length > 0
                ? `${finalContent}\n\n<!--SUGGESTIONS:${JSON.stringify(finalSuggestions)}-->`
                : finalContent;
            supabase
              .from('messages')
              .upsert({
                id: assistantMessageId,
                consultation_id: convId,
                user_id: user.id,
                role: 'assistant',
                content: contentToPersist,
                status: 'done',
                citations: accumulatedCitations,
                routed_namespaces: accumulatedNamespaces,
                created_at: new Date().toISOString(),
              })
              .then(
                ({ error }) => {
                  if (error) console.warn('Direct Supabase message save notice:', error.message);
                },
                (err: any) => console.warn('Direct Supabase message save error:', err)
              );
          } catch (syncErr) {
            console.warn('Supabase direct sync exception:', syncErr);
          }
        }
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
      user,
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
