'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

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
      <div className="min-h-[95dvh] flex items-center justify-center text-sm text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user && !isLoginRoute) {
    // Wait for redirect
    return null;
  }

  return <>{children}</>;
}
