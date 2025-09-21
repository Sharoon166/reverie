'use client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRef, useState, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Leads', href: '/leads' },
  { name: 'Clients', href: '/clients' },
  { name: 'Invoices', href: '/invoices' },
  { name: 'Employees', href: '/employees' },
  { name: 'Expenses', href: '/expenses' },
  { name: 'Reports', href: '/reports' },
  { name: 'Goals', href: '/goals' },
];

  const pathname = usePathname();
  // Find the nav item whose href is a prefix of the current pathname
  const activeItem =
    navItems.find(item =>
      item.href === '/'
        ? pathname === '/'
        : pathname.startsWith(item.href)
    )?.name || 'Dashboard';
  const [target, setTarget] = useState(activeItem); // capsule animates here
  const [capsule, setCapsule] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const navRef = useRef<HTMLDivElement>(null);

  // Update capsule position whenever target changes
  useLayoutEffect(() => {
    if (!navRef.current) return;
    const el = navRef.current.querySelector<HTMLDivElement>(
      `[data-item="${target}"]`
    );
    if (el) {
      setCapsule({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [target]);

  // Update capsule when route changes
  useLayoutEffect(() => {
    setTarget(activeItem);
  }, [activeItem]);

  return (
    <header className="flex items-center justify-between">
      {/* Logo */}
      <Link
        href="/"
        className="text-lg px-4 py-1 border border-black rounded-full"
      >
        Reverie
      </Link>

      <div className="flex items-center gap-2">
        {/* Navigation Capsule */}
        <nav
          ref={navRef}
          className="relative hidden md:flex items-center gap-2 bg-white rounded-full shadow-sm"
          onMouseLeave={() => {
            setTarget(activeItem);
            setHovered(null);
          }} // reset capsule and hovered to active
        >
          {capsule && (
            <motion.div
              className="absolute top-0 bottom-0 z-0 rounded-full bg-black/90"
              style={{ left: 0 }}
              animate={{ left: capsule.left, width: capsule.width }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}

          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              data-item={item.name}
              className="relative px-4 py-3 text-sm font-medium cursor-pointer z-10"
              onMouseEnter={() => {
                setTarget(item.name);
                setHovered(item.name);
              }}
              onClick={() => {
                setTarget(item.name);
              }}
            >
              <span
                className={cn('relative z-10', {
                  'text-white':
                    hovered === item.name || (!hovered && activeItem === item.name),
                  'text-gray-600': hovered ? hovered !== item.name : activeItem !== item.name,
                })}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
