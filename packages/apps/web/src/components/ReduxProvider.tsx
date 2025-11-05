"use client";

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { initAuthState, checkAuthStatus } from '@/store/authSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('Initializing auth state by checking with backend...');
    // Sadece ilk yüklemede çalıştır
    const initAuth = async () => {
      try {
        await store.dispatch(checkAuthStatus()).unwrap();
        console.log('Auth initialization completed');
      } catch (error) {
        console.log('Auth initialization failed:', error);
      }
    };
    
    initAuth();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}