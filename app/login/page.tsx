'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Scale, Shield, AlertCircle } from 'lucide-react';
import { BuildingWireframe } from '@/components/ui/BuildingWireframe';

function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_callback_failed') {
      setErrorMessage('Authentication session exchange failed. Please try signing in again.');
    } else if (error) {
      setErrorMessage(`Authentication error: ${error}`);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const supabase = createClient();
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        setErrorMessage(error.message || 'Failed to initialize Google Sign-In.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Unexpected sign-in error:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden z-0 bg-black text-white font-sans select-none p-6">
      {/* Looping Architectural Blueprint Wireframe Animation */}
      <BuildingWireframe />

      {/* Top Brand Tag */}
      <header className="absolute top-6 left-6 right-6 max-w-5xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <Scale className="w-4 h-4" />
          </div>
          <span className="font-display font-bold tracking-tight text-base text-white">
            REAA <span className="font-mono text-[10px] text-zinc-400 font-normal ml-1">2.0</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-zinc-300" />
          <span>Statutory Grounding</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="w-full max-w-md z-10 my-auto">
        <div className="w-full bg-black/80 border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-xl transition-all shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Sign in to REAA
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              Karnataka Real Estate Regulatory Authority Advisory Intelligence
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Google Login Action Button */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-full px-6 py-3.5 hover:bg-zinc-200 active:scale-[0.99] transition-all text-sm sm:text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon className="w-5 h-5 shrink-0" />
              )}
              <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <p className="text-center text-[11px] text-zinc-500 font-sans leading-relaxed">
              Authorized access for advocates, allottees, and real estate promoters.
            </p>
          </div>

          {/* Multi-tenant Isolation Feature Badges */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>Isolated RLS Data</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>Gazette Synced</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Statutory Disclaimers */}
      <footer className="absolute bottom-4 left-6 right-6 py-2 text-center z-10 pointer-events-none">
        <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
          REAA 2.0 • Karnataka Real Estate Regulatory Authority Intelligence System • Official Gazette Grounded
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center font-sans">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
