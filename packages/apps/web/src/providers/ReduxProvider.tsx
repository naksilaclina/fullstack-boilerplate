"use client";

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { checkAuthStatus } from '@/store/authSlice';
import { authManager } from '@/utils';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize auth only once using the auth manager
    const initAuth = async () => {
      try {
        await authManager.checkAuth(store.dispatch, checkAuthStatus);
        // User is authenticated
      } catch (error: any) {
        // Silently handle unauthenticated state - this is expected
        if (error !== 'UNAUTHENTICATED') {
          console.warn('Auth initialization error:', error);
        }
      }
    };
    
    initAuth();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}