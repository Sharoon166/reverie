'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginRoute = pathname === '/login';

  useEffect(() => {
    if (loading) return;

    console.log('AuthGate state:', { user: !!user, isLoginRoute, pathname });

    if (!user && !isLoginRoute) {
      console.log('Redirecting to login - no user');
      router.replace('/login');
    } else if (user && isLoginRoute) {
      console.log('Redirecting to dashboard - user logged in');
      router.replace('/');
    }
  }, [user, loading, isLoginRoute, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-gray-500">
        Checking session...
      </div>
    );
  }

  if (!user && !isLoginRoute) {
    // Wait for redirect
    return null;
  }

  return <>{children}</>;
}
