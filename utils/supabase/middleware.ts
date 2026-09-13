import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: DO NOT USE getSession() in server/middleware code. Always use getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // If a user is not logged in, redirect any request for / (the main app) to /login
  if (!user && request.nextUrl.pathname === '/') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If a user is already logged in and attempts to access /login, redirect to /
  if (user && request.nextUrl.pathname === '/login') {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
