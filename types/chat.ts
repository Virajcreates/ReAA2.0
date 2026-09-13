import { CitationItem, ReraNamespace } from './rera';

export type MessageRole = 'user' | 'assistant' | 'system';

export type StreamStatus = 'idle' | 'routing' | 'retrieving' | 'generating' | 'done' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  routedNamespaces?: ReraNamespace[];
  citations?: CitationItem[];
  status?: StreamStatus;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  activeNamespaces?: ReraNamespace[];
}

export interface StreamEventData {
  event: 'routing' | 'citations' | 'token' | 'status' | 'error' | 'done';
  data?: {
    routedNamespaces?: ReraNamespace[];
    reasoning?: string;
    citations?: CitationItem[];
    text?: string;
    statusText?: string;
    message?: string;
    error?: string;
  };
}

export interface ChatRequestPayload {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  conversationId?: string;
  namespaces?: ReraNamespace[];
  language?: string;
}
