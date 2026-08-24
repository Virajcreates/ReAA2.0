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
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/15',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-500/30 dark:border-blue-500/40',
        dot: 'bg-blue-500',
      };
    case 'rera-litigation':
      return {
        bg: 'bg-purple-500/10 dark:bg-purple-500/15',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-500/30 dark:border-purple-500/40',
        dot: 'bg-purple-500',
      };
    case 'rera-complaints':
      return {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-500/30 dark:border-indigo-500/40',
        dot: 'bg-indigo-500',
      };
    case 'rera-projects':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/30 dark:border-amber-500/40',
        dot: 'bg-amber-500',
      };
    case 'rera-links':
      return {
        bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-500/30 dark:border-cyan-500/40',
        dot: 'bg-cyan-500',
      };
    default:
      return {
        bg: 'bg-zinc-500/10 dark:bg-zinc-800/60',
        text: 'text-zinc-700 dark:text-zinc-300',
        border: 'border-zinc-500/20 dark:border-zinc-700/60',
        dot: 'bg-zinc-400',
      };
  }
}
