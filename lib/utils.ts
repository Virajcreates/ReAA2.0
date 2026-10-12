import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ReraNamespace } from "@/types/rera";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = "msg"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function getNamespaceBadgeClasses(namespace: ReraNamespace): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (namespace) {
    case 'rera-legal':
    case 'rera-litigation':
    case 'rera-complaints':
    case 'rera-projects':
    case 'rera-links':
      return {
        bg: 'bg-neutral-300',
        text: 'text-neutral-900',
        border: 'border-neutral-400',
        dot: 'bg-neutral-800',
      };
    case 'supabase-sql':
      return {
        bg: 'bg-neutral-300',
        text: 'text-neutral-900',
        border: 'border-neutral-400',
        dot: 'bg-neutral-800',
      };
    default:
      return {
        bg: 'bg-neutral-300',
        text: 'text-neutral-800',
        border: 'border-neutral-400',
        dot: 'bg-neutral-600',
      };
  }
}

/**
 * Extracts and strips dynamic follow-up suggestion questions from assistant message text.
 * Prevents raw <!--SUGGESTIONS:[...]--> tags from leaking into markdown narrative during and after streaming.
 */
export function extractSuggestionsFromContent(text: string): {
  cleanContent: string;
  suggestions: string[];
} {
  if (!text) {
    return { cleanContent: '', suggestions: [] };
  }

  let suggestions: string[] = [];

  // Match complete <!--SUGGESTIONS:[ ... ]--> block
  const match = text.match(/<!--\s*SUGGESTIONS:\s*(\[[\s\S]*?\])\s*-->/i);
  if (match) {
    const rawJson = match[1];
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        suggestions = parsed
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim())
          .slice(0, 3);
      }
    } catch {
      // Fallback regex extraction in case of trailing commas or slight syntax variations
      const stringMatches = rawJson.match(/(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)')/g);
      if (stringMatches) {
        suggestions = stringMatches
          .map((s) => s.slice(1, -1).trim())
          .filter((s) => s.length > 0)
          .slice(0, 3);
      }
    }
  }

  // Strip completed suggestions block
  let cleanContent = text.replace(/<!--\s*SUGGESTIONS:[\s\S]*?-->/gi, '');

  // Strip in-flight / partial suggestion block actively streaming at the end
  const partialIdx = cleanContent.search(/<!--\s*SUGGESTIONS/i);
  if (partialIdx !== -1) {
    cleanContent = cleanContent.substring(0, partialIdx);
  }

  return {
    cleanContent: cleanContent.trimEnd(),
    suggestions,
  };
}

