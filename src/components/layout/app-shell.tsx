"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Menu, X, Search, LogIn, LogOut, User, Upload, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService } from '@/lib/services/user-service';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: 'home' },
  { name: 'Read the Bible', href: '/read', icon: 'read' },
  { name: 'AI Bible Search', href: '/bible-search', icon: 'search' },
];

const EXPLORE_ITEMS = [
  { name: 'Study Tools', href: '/study', icon: 'study', disabled: false },
  { name: 'Bible News', href: '/news', icon: 'news', disabled: false },
  { name: 'Explore More', href: '/explore', icon: 'explore', disabled: false },
  { name: 'Store', href: '/store', icon: 'store', disabled: false },
];

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/></svg>
    ),
    read: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v13c-3-1-6-1-8 1-2-2-5-2-8-1Z"/></svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
    ),
    study: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/></svg>
    ),
    news: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>
    ),
    explore: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M9 15l1.5-4.5L15 9l-1.5 4.5Z"/></svg>
    ),
    store: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8V6a6 6 0 0 1 12 0v2M4 8h16l-1 13H5Z"/></svg>
    ),
  };
  return icons[name] || null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userService = useMemo(() => new UserService(), []);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push('/');
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email
      ? user.email.split('@')[0].slice(0, 2).toUpperCase()
      : 'KA';

  const sidebarContent = (
    <>
      <div className="rpv-brand">
        <div className="rpv-brand-mark">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#E23B4E" strokeWidth="2"><path d="M12 3v8M8.5 7H15.5"/><path d="M4 13c0 3 3.5 5 8 7 4.5-2 8-4 8-7-2-1-5-.5-8 1.5C9 12.5 6 12 4 13Z" stroke="#fff"/></svg>
        </div>
        <div className="rpv-brand-name">RPV <span>Bible</span></div>
      </div>

      <div className="rpv-nav-group">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href as any}
            className={`rpv-nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <NavIcon name={item.icon} />
            {item.name}
          </Link>
        ))}
      </div>

      <div className="rpv-nav-group">
        <div className="rpv-nav-label">Explore</div>
        {EXPLORE_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href as any}
            className={`rpv-nav-item ${item.disabled ? 'disabled' : ''} ${isActive(item.href) ? 'active' : ''}`}
          >
            <NavIcon name={item.icon} />
            {item.name}
          </Link>
        ))}
        {isAuthenticated && (
          <Link
            href="/plans"
            className={`rpv-nav-item ${isActive('/plans') ? 'active' : ''}`}
          >
            <NavIcon name="study" />
            Reading Plans
          </Link>
        )}
        {isAuthenticated && isAdmin && (
          <Link
            href="/admin"
            className={`rpv-nav-item ${isActive('/admin') ? 'active' : ''}`}
          >
            <NavIcon name="store" />
            Admin
          </Link>
        )}
      </div>

      <div className="rpv-sidebar-foot">
        Redemption Project Version<br />© {new Date().getFullYear()} The Redemption Project
      </div>
    </>
  );

  return (
    <div className="rpv-app">
      {/* Desktop sidebar */}
      <aside className="rpv-sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="rpv-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`rpv-sidebar rpv-sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="rpv-main">
        <div className="rpv-topbar">
          <div className="flex items-center gap-3 flex-1">
            <button
              className="lg:hidden p-1"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div
              className="rpv-topbar-search"
              onClick={() => router.push('/search')}
            >
              <Search size={15} />
              <span className="hidden sm:inline">Jump to a passage, book, or topic…</span>
              <span className="sm:hidden">Search…</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="rpv-avatar"
                  aria-label="User menu"
                >
                  {initials}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-neutral-100 bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-400">Signed in</p>
                      <p className="text-sm font-medium text-neutral-900 truncate">{user?.email}</p>
                    </div>
                    <div className="py-2 flex flex-col gap-1">
                      <Link
                        href="/account"
                        onClick={() => setShowUserMenu(false)}
                        className="mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                      >
                        <User size={16} />
                        Account
                      </Link>
                      <Link
                        href="/plans"
                        onClick={() => setShowUserMenu(false)}
                        className="mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                      >
                        <Calendar size={16} />
                        Reading Plans
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                        >
                          <Upload size={16} />
                          Admin
                        </Link>
                      )}
                      <div className="mx-4 border-t border-neutral-100" />
                      <button
                        onClick={handleLogout}
                        className="mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
                href="/login"
                className="flex items-center gap-2 text-sm font-semibold text-[var(--rpv-ink)] hover:text-[var(--red-600)] transition-colors"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>

        <div className="rpv-content">
          {children}
        </div>
      </div>
    </div>
  );
}
