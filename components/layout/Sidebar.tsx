'use client';

import React, { useState, useMemo } from 'react';
import { Conversation } from '@/types/chat';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Scale,
  ChevronLeft,
  Server,
} from 'lucide-react';

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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-80 flex flex-col bg-slate-950/95 border-r border-slate-800/80 transition-transform duration-300 ease-in-out backdrop-blur-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & New Consultation CTA */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-glow">
                <Scale className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Consultations
              </span>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 md:hidden cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-glow transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Consultation</span>
          </button>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search consultations..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-3">
          {groupedConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              {searchQuery ? 'No matching consultations found.' : 'No consultation history yet.'}
            </div>
          ) : (
            groupedConversations.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                      className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-150 text-xs ${
                        isActive
                          ? 'bg-indigo-500/15 text-indigo-200 font-medium border border-indigo-500/30 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/80 border border-transparent'
                      }`}
                    >
                      {/* Icon + Title */}
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-1.5">
                        <MessageSquare
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            isActive ? 'text-indigo-400' : 'text-slate-500'
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
                            className="w-full bg-slate-800 text-xs px-1.5 py-0.5 rounded border border-indigo-500 text-white focus:outline-none"
                          />
                        ) : (
                          <span className="truncate">{conv.title}</span>
                        )}
                      </div>

                      {/* Rename / Delete Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <>
                            <button
                              onClick={(e) => handleSaveRename(conv.id, e)}
                              className="p-1 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                              title="Save title"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(null);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => handleStartRename(conv, e)}
                              className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                              title="Rename consultation"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete consultation"
                            >
                              <Trash2 className="w-3 h-3" />
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

        {/* Footer: Tri-Database Engine Status & Clear History */}
        <div className="p-3.5 border-t border-slate-800/80 space-y-2.5 bg-slate-900/60">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Server className="w-3 h-3 text-indigo-400" />
              <span>Storage Engines Connected (3)</span>
            </span>
            <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
              <span className="px-1.5 py-0.5 rounded border text-center truncate bg-blue-500/10 text-blue-300 border-blue-500/30">
                Pinecone
              </span>
              <span className="px-1.5 py-0.5 rounded border text-center truncate bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                Astra DB
              </span>
              <span className="px-1.5 py-0.5 rounded border text-center truncate bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                Supabase
              </span>
            </div>
          </div>

          {conversations.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all consultation history?')) {
                  onClearAll();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
