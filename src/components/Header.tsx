'use client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useLayoutEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  X,
  Home,
  Users,
  FileText,
  Coins,
  BarChart2,
  Target,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from './ui/button';
import { account } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export default function Header() {
  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
    },
    {
      name: 'Leads',
      href: '/leads',
      icon: Users,
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: User,
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: FileText,
    },
    {
      name: 'Employees',
      href: '/employees',
      icon: Users,
    },
    {
      name: 'Expenses',
      href: '/expenses',
      icon: Coins,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart2,
    },
    {
      name: 'Goals',
      href: '/goals',
      icon: Target,
    },
  ];

  const pathname = usePathname();
  // Find the nav item whose href is a prefix of the current pathname
  const activeItem =
    navItems.find((item) =>
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
    )?.name || 'Dashboard';
  const [target, setTarget] = useState(activeItem);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [capsule, setCapsule] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      localStorage.removeItem('auth:user');
      router.push('/login');
      toast.success('Logged out successfully');
      // Force a full page reload to clear all client-side state
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  // Close mobile menu when clicking outside
  useLayoutEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useLayoutEffect(() => {
    if (!navRef.current) return;
    
    const updateCapsule = () => {
      const el = navRef.current?.querySelector<HTMLDivElement>(
        `[data-item="${target}"]`
      );
      if (el) {
        setCapsule({ left: el.offsetLeft, width: el.offsetWidth });
      }
    };

    const timeoutId = setTimeout(updateCapsule, 50);
    
    return () => clearTimeout(timeoutId);
  }, [target]);

  useLayoutEffect(() => {
    setTarget(activeItem);
  }, [activeItem]);

  return (
    <header className="relative">
      <div className="flex justify-between items-center px-4 md:px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg px-4 py-1 border border-black rounded-full"
          >
            Reverie
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          <nav
            ref={navRef}
            className="relative flex items-center gap-2 bg-white rounded-full shadow-sm"
            onMouseLeave={() => {
              setTarget(activeItem);
            }}
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
                }}
              >
                <span
                  className={cn('relative z-10 transition-colors duration-300', {
                    'text-white': target === item.name,
                    'text-gray-600': target !== item.name,
                  })}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className="max-lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={loading} className='hover:bg-destructive/5  text-destructive cursor-pointer'>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
          {/* Mobile menu button */}
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="ghost"
            className='hover:bg-transparent lg:hidden'
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile menu panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white z-50 shadow-xl p-6 overflow-y-auto"
              ref={mobileMenuRef}
            >
              <div className="flex flex-col h-full space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-semibold">Menu</h2>
                  <Button
                    onClick={() => setMobileMenuOpen(false)}
                    variant="ghost"
                    className="hover:bg-transparent text-destructive"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                <div className="space-y-1 grow">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium ${target === item.name
                          ? 'bg-zinc-900 text-gray-50'
                          : 'text-gray-500 hover:bg-zinc-900 hover:text-gray-50'
                        }`}
                      onClick={() => {
                        setTarget(item.name);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </div>

                {user && (
                  <div className="border-t border-gray-200">
                    <div className="flex items-center px-4 py-3">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mt-2 cursor-pointer"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}