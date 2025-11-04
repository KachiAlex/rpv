"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Monitor, Upload, LogIn, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/hooks/use-auth';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const isActive = (href: string) => pathname === href;
  
  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container-max flex items-center justify-between py-4">
        <Link href="/" className="font-semibold tracking-tight">RPV Bible</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link className={clsx('hover:text-brand-700', isActive('/') && 'text-brand-700 font-medium')} href="/">Home</Link>
          <Link className={clsx('hover:text-brand-700 inline-flex items-center gap-2', isActive('/read') && 'text-brand-700 font-medium')} href="/read"><BookOpenText size={16}/>Read</Link>
          <Link className={clsx('hover:text-brand-700 inline-flex items-center gap-2', isActive('/projector') && 'text-brand-700 font-medium')} href="/projector"><Monitor size={16}/>Projector</Link>
          {isAuthenticated && (
            <Link className={clsx('hover:text-brand-700 inline-flex items-center gap-2', isActive('/admin') && 'text-brand-700 font-medium')} href="/admin"><Upload size={16}/>Admin</Link>
          )}
          
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
              className={clsx('hover:text-brand-700 inline-flex items-center gap-2', isActive('/login') && 'text-brand-700 font-medium')} 
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


