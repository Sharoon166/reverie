import AuthGate from '@/components/AuthGate';
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Quando } from 'next/font/google';
import { Toaster } from 'sonner';

const quando = Quando({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-quando',
});

export const metadata: Metadata = {
  title: 'Reverie',
  description:
    'Reverie is the official CRM platform of Synctom, a leading software house, designed to streamline client management and enhance business productivity.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${quando.variable}`}>
      <body
        style={{
          fontFamily:
            'var(--font-quando), "Geist Sans", "Segoe UI", Arial, sans-serif',
        }}
      >
        <div className="max-w-[85rem] mx-auto p-4 sm:px-8">
          <AuthGate>{children}</AuthGate>
        </div>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
