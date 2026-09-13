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
        bg: 'bg-white/5',
        text: 'text-white',
        border: 'border-white/12',
        dot: 'bg-white',
      };
    case 'supabase-sql':
      return {
        bg: 'bg-white/10',
        text: 'text-white',
        border: 'border-white/20',
        dot: 'bg-white',
      };
    default:
      return {
        bg: 'bg-white/5',
        text: 'text-zinc-300',
        border: 'border-white/10',
        dot: 'bg-zinc-400',
      };
  }
}
