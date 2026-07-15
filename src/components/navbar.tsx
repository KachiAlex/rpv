"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { BookOpenText, Monitor, Upload, LogIn, LogOut, User, Calendar, FileText } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEffect, useMemo, useState } from 'react';
import { UserService } from '@/lib/services/user-service';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileMenu } from '@/components/navigation/mobile-menu';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const userService = useMemo(() => new UserService(), []);
  
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
        const role = await userService.getUserRole(user.uid);
        if (mounted) setIsAdmin(role === 'admin');
      } catch {
        if (mounted) setIsAdmin(false);
      }
    };
    fetchRole();
    return () => { mounted = false; };
  }, [isAuthenticated, user, userService]);

  // Sticky header with scroll behavior
  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide navbar when scrolling down (but not on mobile when menu is open)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        if (window.innerWidth >= 768 || !showMenu) { // Don't hide on mobile when menu is open
          setIsVisible(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          controlNavbar();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, showMenu]);

  return (
    <header className={clsx(
      "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
      "border-b border-brand-200 dark:border-brand-800 bg-gradient-to-r from-white/95 via-brand-50/50 to-white/95 dark:from-neutral-900/95 dark:via-brand-900/30 dark:to-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60 shadow-sm",
      isVisible ? "translate-y-0" : "-translate-y-full"
    )}>
      <div className="container-max flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8">
            <Image
              src="/rpv-icon.svg"
              alt="RPV Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-brand-600 via-accent-purple to-accent-pink bg-clip-text text-transparent">
            RPV Bible
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link 
            className={clsx(
              'touch-target hover:text-brand-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
              isActive('/') && 'text-brand-700 font-medium'
            )} 
            href="/"
          >
            Home
          </Link>
          <Link 
            className={clsx(
              'touch-target hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
              isActive('/read') && 'text-brand-700 font-medium'
            )} 
            href="/read"
          >
            <BookOpenText size={16}/>Read
          </Link>
          <Link 
            className={clsx(
              'touch-target hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
              isActive('/projector') && 'text-brand-700 font-medium'
            )} 
            href="/projector"
          >
            <Monitor size={16}/>Projector
          </Link>
          <Link 
            className={clsx(
              'touch-target hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
              isActive('/blog') && 'text-brand-700 font-medium'
            )} 
            href="/blog"
          >
            <FileText size={16}/>Blog
          </Link>
          {isAuthenticated && (
            <Link 
              className={clsx(
                'touch-target hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
                isActive('/plans') && 'text-brand-700 font-medium'
              )} 
              href="/plans"
            >
              <Calendar size={16}/>Plans
            </Link>
          )}
          {isAuthenticated && isAdmin && (
            <Link
              href="/admin"
              className={clsx(
                'touch-target hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
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
                className="touch-target flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-sm font-semibold hover:border-brand-200 hover:bg-white/80 hover:text-brand-700"
              >
                <User size={16} />
                <span>{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
              </button>
              {showMenu && (
                <div className="mobile-modal-content absolute right-0 mt-3 w-56 rounded-2xl border border-neutral-100 bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur z-50">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-400">Signed in</p>
                    <p className="text-sm font-medium text-neutral-900 truncate">{user?.email}</p>
                  </div>
                  <div className="py-2 flex flex-col gap-1">
                    <Link
                      href="/account"
                      onClick={() => setShowMenu(false)}
                      className="mobile-nav-item mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-brand-50 hover:text-brand-700"
                    >
                      <User size={16} />
                      Account
                    </Link>
                    <Link
                      href="/plans"
                      onClick={() => setShowMenu(false)}
                      className="mobile-nav-item mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Calendar size={16} />
                      Reading Plans
                    </Link>
                    <div className="mx-4 border-t border-neutral-100" />
                    <button
                      onClick={handleLogout}
                      className="mobile-nav-item mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              className={clsx(
                'touch-target hover:text-brand-700 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1',
                isActive('/login') && 'text-brand-700 font-medium'
              )} 
              href="/login"
            >
              <LogIn size={16}/>Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}


