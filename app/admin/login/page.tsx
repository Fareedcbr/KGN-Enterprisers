'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  console.log("AdminLogin component rendered");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("===== HANDLE SUBMIT STARTED =====");
    console.log("Email:", email);
    console.log("Password:", password);

    setLoading(true);
    setError(null);

    try {
      console.log("Calling API...");

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Response Status:", response.status);

      const data = await response.json();
      console.log("Response Body:", data);

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      console.log("Login Successful");

      const redirectTo =
        new URLSearchParams(window.location.search).get('redirectTo') ||
        '/admin';

      router.push(redirectTo);
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container">
      <div className="w-full max-w-md space-y-6 p-8">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">
            TEST LOGIN PAGE
          </h1>

          <p>
            Sign in to access the KGN Electric Showroom admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border rounded p-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            onClick={() => console.log("BUTTON CLICKED")}
            className="bg-blue-600 text-white px-5 py-2 rounded"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

        {error && (
          <div className="text-red-600 mt-4">
            {error}
          </div>
        )}

      </div>
    </div>
  );
}