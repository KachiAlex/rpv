"use client";
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService } from '@/lib/services/user-service';
import { useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const router = useRouter();

  // Use admin/login for admin routes, otherwise use provided redirectTo
  const actualRedirectTo = requireAdmin ? '/admin/login' : redirectTo;

  const checkAdminRole = useCallback(async () => {
    if (!user) return;
    
    setCheckingAdmin(true);
    try {
      const userService = new UserService();
      const role = await userService.getUserRole(user.uid);
      setIsAdmin(role === 'admin');
      
      if (role !== 'admin') {
        router.replace('/admin/login?error=unauthorized' as any);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      router.replace('/admin/login?error=unauthorized' as any);
    } finally {
      setCheckingAdmin(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const returnTo = requireAdmin ? '/admin' : window.location.pathname;
      router.replace(`${actualRedirectTo}?returnTo=${encodeURIComponent(returnTo)}` as any);
      return;
    }

    if (isAuthenticated && requireAdmin && !checkingAdmin && !isAdmin) {
      checkAdminRole();
    }
  }, [loading, isAuthenticated, requireAdmin, checkingAdmin, isAdmin, actualRedirectTo, router, checkAdminRole]);

  if (loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (requireAdmin && !isAdmin) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

