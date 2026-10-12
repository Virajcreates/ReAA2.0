import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid consultation ID provided.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable.' },
        { status: 503 }
      );
    }

    const { data: consultation, error } = await supabase
      .from('consultations')
      .select('id, title, active_namespaces, created_at, updated_at, messages(*)')
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return NextResponse.json(
        { error: 'Consultation not found.' },
        { status: 404 }
      );
    }

    const messages = (consultation.messages || [])
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

    return NextResponse.json({
      consultation: {
        id: consultation.id,
        title: consultation.title || 'Consultation Archive',
        createdAt: new Date(consultation.created_at).getTime(),
        activeNamespaces: consultation.active_namespaces || [],
        messages,
      },
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/share/[id]:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
