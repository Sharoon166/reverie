'use client';

import { useState } from 'react';
import { account } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
const STORAGE_KEY = 'auth:user';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      console.log('Creating session...');
      await account.createEmailPasswordSession(email.trim(), password);
      console.log('Session created successfully');
      
      // Fetch user and persist to localStorage for instant AuthGate pass
      try {
        const me = await account.get();
        console.log('User data fetched:', me);
        const u = { id: me.$id, email: me.email, name: me.name };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        console.log('User data stored in localStorage');
      } catch (userErr) {
        console.error('Error fetching user data:', userErr);
      }
      
      toast.success('Logged in successfully');
      console.log('Attempting redirect to /');
      
      window.location.href = '/';
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Card className="w-full max-w-md p-8 border-0 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-600 mt-1">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="text-xs text-gray-500 text-center mt-4">
          Having trouble? Contact your admin.
        </div>
      </Card>
    </div>
  );
}
