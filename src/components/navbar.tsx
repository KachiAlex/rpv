"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Monitor, Upload, LogIn, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEffect, useState } from 'react';
import { UserService } from '@/lib/services/user-service';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
  };

  useEffect(() => {
    let mounted = true;
    const fetchRole = async () => {
      try {
        if (!isAuthenticated || !user) {
          if (mounted) setIsAdmin(false);
          return;
        }
        const service = new UserService();
        const role = await service.getUserRole(user.uid);
        if (mounted) setIsAdmin(role === 'admin');
      } catch {
        if (mounted) setIsAdmin(false);
      }
    };
    fetchRole();
    return () => { mounted = false; };
  }, [isAuthenticated, user?.uid]);

  return (
    <header className="border-b border-brand-200 dark:border-brand-800 bg-gradient-to-r from-white/95 via-brand-50/50 to-white/95 dark:from-neutral-900/95 dark:via-brand-900/30 dark:to-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60 shadow-sm">
      <div className="container-max flex items-center justify-between py-4">
        <Link href="/" className="font-bold text-xl tracking-tight bg-gradient-to-r from-brand-600 via-accent-purple to-accent-pink bg-clip-text text-transparent">
          RPV Bible
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link 
            className={clsx(
              'hover:text-brand-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
              isActive('/') && 'text-brand-700 font-medium'
            )} 
            href="/"
          >
            Home
          </Link>
          <Link 
            className={clsx(
              'hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
              isActive('/read') && 'text-brand-700 font-medium'
            )} 
            href="/read"
          >
            <BookOpenText size={16}/>Read
          </Link>
          <Link 
            className={clsx(
              'hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
              isActive('/projector') && 'text-brand-700 font-medium'
            )} 
            href="/projector"
          >
            <Monitor size={16}/>Projector
          </Link>
          {isAuthenticated && isAdmin && (
            <Link
              href="/admin"
              className={clsx(
                'hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
                (isActive('/admin') || isActive('/admin/login')) && 'text-brand-700 font-medium'
              )}
            >
              <Upload size={16}/>Admin
            </Link>
          )}
          
          <ThemeToggle />
          
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 hover:text-brand-700"
              >
                <User size={16} />
                <span>{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                  <div className="px-4 py-2 text-xs text-neutral-500 border-b">
                    {user?.email}
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setShowMenu(false)}
                    className="block w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 text-sm"
                  >
                    <User size={16} />
                    Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 text-sm"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              className={clsx(
                'hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
                isActive('/login') && 'text-brand-700 font-medium'
              )} 
              href="/login"
            >
              <LogIn size={16}/>Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}


