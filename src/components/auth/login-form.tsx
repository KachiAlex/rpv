"use client";
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);
  const { signIn, signUp, resetPassword, error, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password, displayName || undefined);
      } else {
        await signIn(email, password);
      }
      router.push('/');
    } catch (err) {
      // Error is handled by useAuth hook
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(resetEmail);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Password reset is not available.');
    }
  };

  if (showReset) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter your email"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
            <button
              type="button"
              onClick={() => setShowReset(false)}
              className="px-4 py-2 border rounded-md hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Your name (optional)"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border rounded-md"
              placeholder="your@email.com"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border rounded-md"
              placeholder="••••••••"
            />
          </div>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <LogIn size={18} />
          {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>
      
      <div className="mt-4 space-y-2">
        {!isSignUp && (
          <button
            onClick={() => setShowReset(true)}
            className="w-full text-sm text-brand-600 hover:text-brand-700"
          >
            Forgot password?
          </button>
        )}
        
        <div className="text-center text-sm text-neutral-600">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button onClick={() => setIsSignUp(false)} className="text-brand-600 hover:text-brand-700">
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button onClick={() => setIsSignUp(true)} className="text-brand-600 hover:text-brand-700">
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

