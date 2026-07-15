"use client";
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { UserService } from '@/lib/services/user-service';

export default function SetupPage() {
  const { user, signUp, signIn, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@rpvbible.com');
  const [password, setPassword] = useState('Admin123!@#');
  const [confirmPassword, setConfirmPassword] = useState('Admin123!@#');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsCreating(true);

    try {
      let userId: string;

      // Check if user exists, if so sign in, otherwise sign up
      try {
        await signIn(email, password);
        userId = user?.uid || '';
      } catch (signInError) {
        // User doesn't exist, create new account
        const newUser = await signUp(email, password, 'Admin');
        userId = newUser.uid;
      }

      // Create user profile with admin role
      const userService = new UserService();
      await userService.createUserProfile(user || { uid: userId, email } as any);
      
      // Set admin role
      await userService.setAdminRole(userId, true);

      setSuccess(true);
      
      // Redirect to admin page after a moment
      setTimeout(() => {
        router.push('/admin');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin account');
      console.error('Error creating admin:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // If already authenticated and is admin, redirect
  if (isAuthenticated && user) {
    const checkAdmin = async () => {
      const userService = new UserService();
      const role = await userService.getUserRole(user.uid);
      if (role === 'admin') {
        router.push('/admin');
      }
    };
    checkAdmin();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg border">
        <div>
          <h2 className="text-2xl font-bold text-center">Create Admin Account</h2>
          <p className="mt-2 text-sm text-neutral-600 text-center">
            Set up your first admin account for RPV Bible
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3">
            <p className="text-sm text-green-800">
              ✅ Admin account created successfully! Redirecting to admin page...
            </p>
          </div>
        )}

        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="admin@rpvbible.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Confirm Password"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating || success}
            className="w-full rounded-md bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating Admin Account...' : 'Create Admin Account'}
          </button>
        </form>

        <div className="text-xs text-neutral-500 text-center">
          <p>⚠️ This page should be removed after creating your first admin account.</p>
        </div>
      </div>
    </div>
  );
}

