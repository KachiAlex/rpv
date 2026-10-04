"use client";
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserService } from '@/lib/services/user-service';

export function ChangePasswordForm() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userService = new UserService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!user) {
      setError('You must be signed in to change your password');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(user.uid, currentPassword, newPassword);
      setMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full rounded-md border p-2"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-md border p-2"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-md border p-2"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Updating…' : 'Change Password'}
      </button>
    </form>
  );
}
