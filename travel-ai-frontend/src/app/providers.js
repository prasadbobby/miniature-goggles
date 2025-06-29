'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getToken, removeToken } from '../lib/auth';
import { authAPI } from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const protectedRoutes = ['/dashboard', '/itineraries', '/bookings', '/profile'];
  const publicRoutes = ['/', '/auth/login', '/auth/register'];

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      
      if (token && isAuthenticated()) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth error:', error);
          removeToken();
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
      
      if (isProtected && !user) {
        router.push('/auth/login');
      } else if (pathname.startsWith('/auth') && user) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = (userData, token) => {
    setUser(userData);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}