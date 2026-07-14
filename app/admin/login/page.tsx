'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (adminError) throw adminError;
      if (!adminData) {
        throw new Error('User is not authorized as an admin');
      }

      // Redirect to the intended page or /admin
      const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || '/admin';
      window.location.href = redirectTo;
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="font-display-lg text-3xl font-bold text-on-surface">
            Admin Login
          </h1>
          <p className="text-on-surface-variant">
            Sign in to access the KGN Electric Showroom admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
            />
          </div>

          <div>
            <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-lg text-sm font-bold ev-glow ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-4 bg-error-container/20 text-error rounded-lg">
            <span className="material-symbols-outlined mr-2">error</span>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}