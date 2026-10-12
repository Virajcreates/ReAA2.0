'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  PanelLeftClose,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

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
  user?: User | null;
}

export const Sidebar = React.memo(function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConsultation,
  onDeleteConversation,
  onClearAll,
  onRenameConversation,
  user,
}: SidebarProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (user !== undefined) {
      setCurrentUser(user);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (e) {
      console.error('Sign out error:', e);
      window.location.href = '/login';
    }
  };

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

    filtered.forEach((conv) => {
      const updatedAt = conv.updatedAt || conv.createdAt;
      if (updatedAt >= today) {
        groups[0].items.push(conv);
      } else if (updatedAt >= yesterday) {
        groups[1].items.push(conv);
      } else if (updatedAt >= pastWeek) {
        groups[2].items.push(conv);
      } else {
        groups[3].items.push(conv);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [conversations, searchQuery]);

  return (
    <>
      {/* Mobile Backdrop Overlay when sidebar is open */}
      <div
        className={`fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-xs md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col h-screen bg-neutral-200 border-r border-neutral-400 transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-72 sm:w-80 translate-x-0 opacity-100 shadow-2xl md:shadow-none'
            : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:opacity-0 md:overflow-hidden pointer-events-none'
        }`}
        aria-label="Consultations sidebar"
      >
        <div className="flex flex-col h-full w-72 sm:w-80">
          {/* Header & Brand */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-400">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-neutral-800" />
              <span className="font-display font-bold text-sm sm:text-base tracking-wider text-neutral-900 uppercase">
                Consultations
              </span>
            </div>
            {/* Retract / Collapse button inside sidebar */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Consultation CTA Button */}
          <div className="p-3">
            <button
              onClick={() => {
                onNewConsultation();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-neutral-800 hover:bg-neutral-900 text-neutral-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Consultation</span>
            </button>
          </div>

          {/* Search Filter Bar */}
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <input
                type="text"
                placeholder="Search consultations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-neutral-300 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-500 border border-neutral-400 focus:outline-none focus:border-neutral-600 transition-colors font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-neutral-500 hover:text-neutral-800 p-0.5"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 no-scrollbar">
            {groupedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-neutral-500 mb-2" />
                <p className="text-xs text-neutral-600 font-sans">
                  {searchQuery ? 'No matching consultations found.' : 'No consultation history yet.'}
                </p>
              </div>
            ) : (
              groupedConversations.map((group) => (
                <div key={group.label} className="space-y-1">
                  <span className="px-2 text-[10px] font-mono font-semibold tracking-wider text-neutral-500 uppercase">
                    {group.label}
                  </span>
                  <div className="space-y-0.5">
                    {group.items.map((conv) => {
                      const isActive = conv.id === activeConversationId;
                      const isEditing = editingId === conv.id;

                      return (
                        <div
                          key={conv.id}
                          className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer font-sans ${
                            isActive
                              ? 'bg-neutral-300 text-neutral-900 font-semibold border border-neutral-400'
                              : 'text-neutral-600 hover:bg-neutral-300 hover:text-neutral-900 border border-transparent'
                          }`}
                          onClick={() => {
                            if (!isEditing) {
                              onSelectConversation(conv.id);
                              if (window.innerWidth < 768) onClose();
                            }
                          }}
                        >
                          <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`} />

                          {isEditing ? (
                            <div
                              className="flex-1 flex items-center gap-1 min-w-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (editTitle.trim()) {
                                      onRenameConversation(conv.id, editTitle.trim());
                                    }
                                    setEditingId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingId(null);
                                  }
                                }}
                                className="flex-1 min-w-0 bg-neutral-200 px-2 py-0.5 rounded-lg text-xs text-neutral-900 border border-neutral-600 focus:outline-none font-sans"
                              />
                              <button
                                onClick={() => {
                                  if (editTitle.trim()) {
                                    onRenameConversation(conv.id, editTitle.trim());
                                  }
                                  setEditingId(null);
                                }}
                                className="text-neutral-700 hover:text-neutral-900 p-0.5"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-neutral-500 hover:text-neutral-700 p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 truncate select-none text-left">
                                {conv.title || 'New Consultation'}
                              </span>

                              {/* Action Buttons on Hover */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(conv.id);
                                    setEditTitle(conv.title);
                                  }}
                                  className="p-1 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-neutral-300"
                                  title="Rename"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteConversation(conv.id);
                                  }}
                                  className="p-1 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-300"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Metadata & Storage Status */}
          <div className="p-3 border-t border-neutral-400 space-y-3 bg-neutral-200">
            {/* Logged-in User Profile Section */}
            {currentUser && (
              <div className="p-2.5 rounded-2xl bg-neutral-300/80 border border-neutral-400 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {currentUser.user_metadata?.avatar_url ? (
                    <img
                      src={currentUser.user_metadata.avatar_url}
                      alt={currentUser.user_metadata?.full_name || 'User'}
                      className="w-8 h-8 rounded-full border border-neutral-400 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-400/50 border border-neutral-400 flex items-center justify-center text-neutral-900 shrink-0 font-display font-semibold text-xs">
                      {(currentUser.user_metadata?.full_name || currentUser.email || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate leading-tight">
                      {currentUser.user_metadata?.full_name ||
                        currentUser.email?.split('@')[0] ||
                        'Advisor User'}
                    </p>
                    <p className="text-[10px] text-neutral-600 truncate font-mono mt-0.5">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-400 bg-neutral-200 hover:bg-neutral-300 hover:border-neutral-500 text-neutral-800 hover:text-neutral-950 transition-colors shrink-0 cursor-pointer shadow-xs font-sans text-xs font-medium"
                  title="Sign out of REAA"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="font-semibold text-[11px] whitespace-nowrap">Sign Out</span>
                </button>
              </div>
            )}

            {/* Clear All Sessions */}
            {conversations.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all consultation history?')) {
                    onClearAll();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] text-neutral-600 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
});
