'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Check if username is taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUser) {
      setError('That username is already taken.');
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.toLowerCase(),
      });
    }

    router.push('/garden');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Plant your first seed</h1>
        <p className="text-[#8b95a8] text-sm mb-8">Create your garden and start growing.</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label htmlFor="signup-username" className="text-xs text-[#8b95a8] mb-1 block">Username</label>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              className="w-full px-4 py-3 bg-[#141820] border border-[#252a38] rounded-lg text-[#e0e6f0] focus:outline-none focus:border-[#4a8a50] transition-colors"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="text-xs text-[#8b95a8] mb-1 block">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#141820] border border-[#252a38] rounded-lg text-[#e0e6f0] focus:outline-none focus:border-[#4a8a50] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="text-xs text-[#8b95a8] mb-1 block">Password</label>
            <input
              id="signup-password"
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
            {loading ? 'Creating garden...' : 'Start growing'}
          </button>
        </form>

        <p className="text-sm text-[#8b95a8] text-center mt-6">
          Already have a garden?{' '}
          <Link href="/login" className="text-[#6ee7a0] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
