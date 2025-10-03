'use client';

import { useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';

type User = {
  id: string;
  email: string;
  name: string;
} | null;

const STORAGE_KEY = 'auth:user';

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap from localStorage to avoid redirect flicker
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as User;
        if (cached && cached.id) {
          setUser(cached);
          setLoading(false);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('Checking for current session...');
        const session = await account.getSession('current');
        console.log('Session found:', !!session?.userId);

        if (session?.userId) {
          const userData = await account.get();
          console.log('User data loaded:', userData.email);
          const u = {
            id: userData.$id,
            email: userData.email,
            name: userData.name,
          } as const;
          setUser(u);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          } catch {}
        } else {
          console.log('No valid session found');
          setUser(null);
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
        }
      } catch (err) {
        console.log('Session check failed:', err);
        // No session
        setUser(null);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading };
}
