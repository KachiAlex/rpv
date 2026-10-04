import * as apiService from './api';

interface AdminUser {
  uid: string;
  email: string;
  isAdmin: boolean;
  role: 'admin' | 'user';
}

export async function checkAdminStatus(_userId: string): Promise<boolean> {
  try {
    return (await apiService.getUserRole()) === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getAdminUser(_userId: string): Promise<AdminUser | null> {
  try {
    const user = apiService.getCurrentUser();
    if (!user) return null;
    const role = await apiService.getUserRole();
    if (role !== 'admin') return null;
    return {
      uid: user.uid,
      email: user.email,
      isAdmin: true,
      role: 'admin',
    };
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}

export async function createAdminUser(_userId: string, _email: string): Promise<void> {
  throw new Error('Admin management is handled in the web admin panel');
}

export async function removeAdminUser(_userId: string): Promise<void> {
  throw new Error('Admin management is handled in the web admin panel');
}
