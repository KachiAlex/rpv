"use client";
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserService } from '@/lib/services/user-service';
import { LogIn, Mail, Lock, AlertCircle, Shield } from 'lucide-react';

function AdminLoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for error query parameter
  useEffect(() => {
    if (!searchParams) return;
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setError('This account does not have admin privileges. Please contact an administrator.');
    }
  }, [searchParams]);

  // Check if user is already authenticated and is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isAuthenticated && user) {
        try {
          const userService = new UserService();
          const role = await userService.getUserRole(user.uid);
          if (role === 'admin') {
            // Already admin, redirect to admin page
            const returnTo = searchParams?.get('returnTo') || '/admin';
            router.push(returnTo as any);
          } else {
            setError('This account does not have admin privileges. Please contact an administrator.');
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
        }
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const signedInUser = await signIn(email, password);
      
      // Wait a moment for user state to update, then check admin status
      setTimeout(async () => {
        if (signedInUser) {
          try {
            const userService = new UserService();
            const role = await userService.getUserRole(signedInUser.uid);
            
            if (role === 'admin') {
              const returnTo = searchParams?.get('returnTo') || '/admin';
              router.push(returnTo as any);
            } else {
              setError('This account does not have admin privileges. Please contact an administrator.');
              setIsLoading(false);
            }
          } catch (err) {
            setError('Failed to verify admin status. Please try again.');
            setIsLoading(false);
          }
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg border">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 mb-4">
            <Shield className="h-6 w-6 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Admin Login</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Sign in with your admin account to access the admin panel
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-neutral-500">
            Need admin access? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}

