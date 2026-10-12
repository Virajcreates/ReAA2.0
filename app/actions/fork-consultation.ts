'use server';

import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { generateId } from '@/lib/utils';

export interface FallbackMessagePayload {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  routedNamespaces?: string[];
  citations?: any[];
  status?: string;
}

export interface FallbackConsultationPayload {
  title?: string;
  activeNamespaces?: string[];
  messages?: FallbackMessagePayload[];
}

export interface ForkResult {
  success: boolean;
  newConsultationId?: string;
  clonedConsultation?: any;
  error?: string;
  redirectUrl?: string;
}

export async function forkConsultation(
  originalId: string,
  fallbackData?: FallbackConsultationPayload
): Promise<ForkResult> {
  if (!originalId) {
    return { success: false, error: 'Original consultation ID is required.' };
  }

  try {
    // 1. Get current logged-in user with standard server SSR client
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        redirectUrl: `/login?next=/share/${encodeURIComponent(originalId)}`,
        error: 'Authentication required to continue this consultation.',
      };
    }

    // 2. Initialize Admin client with SUPABASE_SECRET_KEY to safely fetch original data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
    const supabaseSecretKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;

    const adminClient = createAdminClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Attempt to fetch from Supabase
    let title = fallbackData?.title || 'Shared Consultation';
    let activeNamespaces = fallbackData?.activeNamespaces || [
      'rera-legal',
      'rera-litigation',
      'rera-complaints',
      'rera-projects',
    ];
    let rawMessages: any[] = fallbackData?.messages || [];

    const { data: original, error: fetchError } = await adminClient
      .from('consultations')
      .select('id, title, active_namespaces, messages(*)')
      .eq('id', originalId)
      .single();

    if (original && !fetchError) {
      title = original.title || title;
      if (original.active_namespaces) activeNamespaces = original.active_namespaces;
      if (Array.isArray(original.messages) && original.messages.length > 0) {
        rawMessages = original.messages;
      }
    }

    // 3. Generate a new unique ID for the cloned consultation
    const newConsultationId = generateId('conv');
    const nowEpoch = Date.now();
    const nowIso = new Date(nowEpoch).toISOString();
    const cleanTitle = title.replace(/\s*\(Fork\)$/i, '') + ' (Fork)';

    // Insert cloned consultation into Supabase
    const { error: insertConvError } = await adminClient
      .from('consultations')
      .insert({
        id: newConsultationId,
        user_id: user.id,
        title: cleanTitle,
        active_namespaces: activeNamespaces,
        created_at: nowIso,
        updated_at: nowIso,
      });

    if (insertConvError) {
      console.warn('Supabase consultation fork insert notice:', insertConvError.message);
    }

    // 4. Clone messages
    const sortedMessages = [...rawMessages].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.timestamp || 0);
      const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.timestamp || 0);
      return timeA - timeB;
    });

    const clonedMessages = sortedMessages.map((msg, idx) => {
      const msgTimestamp = nowEpoch + idx * 50;
      return {
        id: generateId('msg'),
        consultation_id: newConsultationId,
        user_id: user.id,
        role: msg.role,
        content: msg.content || msg.text || msg.response || msg.message || '',
        routed_namespaces: msg.routed_namespaces || msg.routedNamespaces || [],
        citations: msg.citations || [],
        status: msg.status || 'done',
        created_at: new Date(msgTimestamp).toISOString(),
        timestamp: msgTimestamp,
      };
    });

    if (clonedMessages.length > 0) {
      const dbMessages = clonedMessages.map((m) => ({
        id: m.id,
        consultation_id: m.consultation_id,
        user_id: m.user_id,
        role: m.role,
        content: m.content,
        routed_namespaces: m.routed_namespaces,
        citations: m.citations,
        status: m.status,
        created_at: m.created_at,
      }));

      const { error: insertMsgError } = await adminClient
        .from('messages')
        .insert(dbMessages);

      if (insertMsgError) {
        console.warn('Supabase message fork insert notice:', insertMsgError.message);
      }
    }

    // Build the full in-memory conversation object so the client can also immediately cache it
    const clonedConversation = {
      id: newConsultationId,
      title: cleanTitle,
      createdAt: nowEpoch,
      updatedAt: nowEpoch,
      activeNamespaces,
      messages: clonedMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        routedNamespaces: m.routed_namespaces,
        citations: m.citations,
        status: m.status,
      })),
    };

    return {
      success: true,
      newConsultationId,
      clonedConsultation: clonedConversation,
    };
  } catch (err: any) {
    console.error('Unexpected error during consultation fork:', err);
    return {
      success: false,
      error: err?.message || 'Failed to clone consultation.',
    };
  }
}
