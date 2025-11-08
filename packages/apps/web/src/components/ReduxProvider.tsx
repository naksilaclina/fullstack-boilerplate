"use client";

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { initAuthState, checkAuthStatus } from '@/store/authSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sadece ilk yüklemede çalıştır
    const initAuth = async () => {
      try {
        await store.dispatch(checkAuthStatus()).unwrap();
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