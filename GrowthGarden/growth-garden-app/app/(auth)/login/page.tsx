'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid email or password combination.');
      setLoading(false);
      return;
    }

    router.push('/garden');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-[#8b95a8] text-sm mb-8">Your garden is waiting.</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="text-xs text-[#8b95a8] mb-1 block">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#141820] border border-[#252a38] rounded-lg text-[#e0e6f0] focus:outline-none focus:border-[#4a8a50] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="text-xs text-[#8b95a8] mb-1 block">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-[#141820] border border-[#252a38] rounded-lg text-[#e0e6f0] focus:outline-none focus:border-[#4a8a50] transition-colors"
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-[#c05030]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#4a8a50] text-white font-medium hover:bg-[#5a9a60] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-[#8b95a8] text-center mt-6">
          No account yet?{' '}
          <Link href="/signup" className="text-[#6ee7a0] hover:underline">
            Start growing
          </Link>
        </p>
      </div>
    </div>
  );
}
