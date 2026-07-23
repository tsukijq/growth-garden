'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/actions/auth';
import { AuthResult } from '@/lib/types';

const initialState: AuthResult = { success: false };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(register, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push('/garden');
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#f7f9f4]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-[#1F2A1F]">Plant your first seed</h1>
        <p className="text-[#6b7a6b] text-sm mb-8">Create your garden and start growing.</p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="signup-email" className="text-xs text-[#6b7a6b] mb-1 block">
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              required
              aria-describedby={state.error ? 'signup-error' : undefined}
              className="w-full px-4 py-3 bg-white border border-[#e2e5da] rounded-lg text-[#1F2A1F] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="text-xs text-[#6b7a6b] mb-1 block">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              required
              minLength={8}
              aria-describedby={state.error ? 'signup-error' : undefined}
              className="w-full px-4 py-3 bg-white border border-[#e2e5da] rounded-lg text-[#1F2A1F] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59] transition-colors"
              placeholder="At least 8 characters"
            />
          </div>

          {state.error && (
            <p id="signup-error" role="alert" className="text-sm text-[#c44030]">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-lg bg-[#4A7C59] text-white font-medium hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Creating garden...' : 'Start growing'}
          </button>
        </form>

        <p className="text-sm text-[#6b7a6b] text-center mt-6">
          Already have a garden?{' '}
          <Link href="/login" className="text-[#4A7C59] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
