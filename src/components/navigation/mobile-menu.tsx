"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpenText, Monitor, Upload, LogIn, LogOut, User, Calendar, FileText } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService } from '@/lib/services/user-service';

interface MobileMenuProps {
  className?: string;
}

export function MobileMenu({ className = '' }: MobileMenuProps) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  // Check admin status
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

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className={`md:hidden ${className}`}>
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleMenu}
        className="touch-target touch-feedback p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={24} className="text-gray-700" />
        ) : (
          <Menu size={24} className="text-gray-700" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="mobile-modal animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Menu Content */}
          <div className="mobile-modal-content animate-slide-in-right absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={closeMenu}
                className="touch-target touch-feedback p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                aria-label="Close menu"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              <Link 
                href="/"
                className={clsx(
                  'mobile-nav-item flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive('/') 
                    ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-500' 
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                </div>
                Home
              </Link>

              <Link 
                href="/read"
                className={clsx(
                  'mobile-nav-item flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive('/read') 
                    ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-500' 
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <BookOpenText size={20} />
                Read
              </Link>

              <Link 
                href="/projector"
                className={clsx(
                  'mobile-nav-item flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive('/projector') 
                    ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-500' 
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Monitor size={20} />
                Projector
              </Link>

              <Link 
                href="/blog"
                className={clsx(
                  'mobile-nav-item flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive('/blog') 
                    ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-500' 
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <FileText size={20} />
                Blog
              </Link>

              {isAuthenticated && (
                <Link 
                  href="/plans"
                  className={clsx(
                    'mobile-nav-item flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive('/plans') 
                      ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-500' 
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Calendar size={20} />
                  Plans
                </Link>
              )}

              {isAuthenticated && isAdmin && (
                <Link
                  href="/admin"
                  className={clsx(
                    'mobile-nav-item flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    (isActive('/admin') || isActive('/admin/login')) 
                      ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-500' 
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Upload size={20} />
                  Admin
                </Link>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 my-4" />

              {/* User Section */}
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.displayName || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </div>
                  </div>
                  
                  <Link
                    href="/account"
                    className="mobile-nav-item flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={20} />
                    Account
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="mobile-nav-item w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login"
                  className={clsx(
                    'mobile-nav-item flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive('/login') 
                      ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-500' 
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <LogIn size={20} />
                  Sign In
                </Link>
              )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                RPV Bible - Mobile
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}