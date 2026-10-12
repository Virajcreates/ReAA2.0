export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
  SharedConsultationClient,
  SharedConsultationData,
} from './SharedConsultationClient';

interface SharedPageProps {
  params: { id: string };
}

export default async function SharedConsultationPage({ params }: SharedPageProps) {
  // 1. Session verification: enforce authentication with standard SSR client
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/share/${params.id}`);
  }

  // 2. Fetch consultation using Supabase Admin client to safely bypass RLS for shared access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
  const supabaseSecretKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;

  const adminAuthClient = createAdminClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data: consultation, error } = await adminAuthClient
    .from('consultations')
    .select('id, title, active_namespaces, created_at, updated_at, messages(*)')
    .eq('id', params.id)
    .single();

  let initialData: SharedConsultationData | null = null;

  if (consultation && !error) {
    const sortedMessages = (consultation.messages || [])
      .sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map((m: any) => ({
        id: m.id,
        role: m.role,
        content:
          m.content ||
          m.text ||
          m.response ||
          m.message ||
          (m.parts?.find((p: any) => p.type === 'text')?.text) ||
          '',
        timestamp: new Date(m.created_at).getTime(),
        routedNamespaces: m.routed_namespaces || [],
        citations: m.citations || [],
        status: m.status || 'done',
      }));

    initialData = {
      id: consultation.id,
      title: consultation.title || 'Consultation Archive',
      createdAt: new Date(consultation.created_at).getTime(),
      activeNamespaces: consultation.active_namespaces,
      messages: sortedMessages,
    };
  }

  return (
    <SharedConsultationClient
      id={params.id}
      initialConsultation={initialData}
    />
  );
}
