import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure target path is valid relative URL
      const target = next.startsWith('/') ? next : `/${next}`;
      return NextResponse.redirect(new URL(target, request.url));
    }
    console.error('Supabase auth code exchange error:', error);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
