'use client';

import React, { useState, useMemo } from 'react';
import { Conversation } from '@/types/chat';
import { RERA_NAMESPACES, ReraNamespace } from '@/types/rera';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Scale,
  Database,
  Layers,
  ChevronLeft,
} from 'lucide-react';
import { formatDate, getNamespaceBadgeClasses } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConsultation: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConsultation,
  onDeleteConversation,
  onClearAll,
  onRenameConversation,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const pastWeek = today - 86400000 * 7;

    const groups: { label: string; items: Conversation[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Previous 7 Days', items: [] },
      { label: 'Older Consultations', items: [] },
    ];

    for (const conv of filtered) {
      const time = conv.updatedAt || conv.createdAt;
      if (time >= today) {
        groups[0].items.push(conv);
      } else if (time >= yesterday) {
        groups[1].items.push(conv);
      } else if (time >= pastWeek) {
        groups[2].items.push(conv);
      } else {
        groups[3].items.push(conv);
      }
    }

    return groups.filter((g) => g.items.length > 0);
  }, [conversations, searchQuery]);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-80 flex flex-col bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Action Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Scale className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                Consultations
              </span>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 md:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Consultation Button */}
          <button
            onClick={() => {
              onNewConsultation();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all duration-200 hover:shadow-emerald-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Legal Consultation</span>
          </button>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past consultations..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {groupedConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500">
              {searchQuery ? 'No matching consultations found.' : 'No consultation history yet.'}
            </div>
          ) : (
            groupedConversations.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {group.label}
                </div>

                {group.items.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const isEditing = editingId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 text-xs ${
                        isActive
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-medium border border-emerald-500/30'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'
                      }`}
                    >
                      {/* Icon + Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        <MessageSquare
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
                          }`}
                        />

                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id, e as any);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="w-full bg-white dark:bg-zinc-800 text-xs px-1.5 py-0.5 rounded border border-emerald-500 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                          />
                        ) : (
                          <span className="truncate">{conv.title}</span>
                        )}
                      </div>

                      {/* Actions: Rename / Delete */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <>
                            <button
                              onClick={(e) => handleSaveRename(conv.id, e)}
                              className="p-1 text-emerald-600 hover:text-emerald-700"
                              title="Save title"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(null);
                              }}
                              className="p-1 text-zinc-400 hover:text-zinc-600"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => handleStartRename(conv, e)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                              title="Rename consultation"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv.id);
                              }}
                              className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                              title="Delete consultation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer: Namespace Summary & Clear History */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-white/50 dark:bg-zinc-900/50">
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-500" />
              <span>Active Pinecone Namespaces (4)</span>
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {(Object.keys(RERA_NAMESPACES) as ReraNamespace[]).map((ns) => {
                const badge = getNamespaceBadgeClasses(ns);
                return (
                  <span
                    key={ns}
                    className={`px-1.5 py-0.5 rounded border truncate ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {ns}
                  </span>
                );
              })}
            </div>
          </div>

          {conversations.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all consultation history?')) {
                  onClearAll();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Consultation History</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
