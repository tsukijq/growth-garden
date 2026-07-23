'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/actions/auth';
import { AuthResult } from '@/lib/types';

const initialState: AuthResult = { success: false };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push('/garden');
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#f7f9f4]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-[#1F2A1F]">Welcome back</h1>
        <p className="text-[#6b7a6b] text-sm mb-8">Your garden is waiting.</p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="text-xs text-[#6b7a6b] mb-1 block">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              aria-describedby={state.error ? 'login-error' : undefined}
              className="w-full px-4 py-3 bg-white border border-[#e2e5da] rounded-lg text-[#1F2A1F] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="text-xs text-[#6b7a6b] mb-1 block">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              minLength={8}
              aria-describedby={state.error ? 'login-error' : undefined}
              className="w-full px-4 py-3 bg-white border border-[#e2e5da] rounded-lg text-[#1F2A1F] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59] transition-colors"
              placeholder="At least 8 characters"
            />
          </div>

          {state.error && (
            <p id="login-error" role="alert" className="text-sm text-[#c44030]">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-lg bg-[#4A7C59] text-white font-medium hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-[#6b7a6b] text-center mt-6">
          No account yet?{' '}
          <Link href="/signup" className="text-[#4A7C59] hover:underline font-medium">
            Start growing
          </Link>
        </p>
      </div>
    </div>
  );
}
