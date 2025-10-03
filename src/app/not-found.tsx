import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, LayoutDashboard, Search } from 'lucide-react';
import DashboardPage from './(Dashboard)/page';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
      <div className="space-y-6">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          Looks like this page went on a coffee break.{' '}
          <span className="block mt-1">Let's get you back on track.</span>
        </p>
        <div className="pt-4">
          <Button asChild className="gap-2">
            <Link href="/">
              <LayoutDashboard />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
