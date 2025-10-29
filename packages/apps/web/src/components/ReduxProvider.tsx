"use client";

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { initAuthState, checkAuthStatus } from '@/store/authSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('Initializing auth state by checking with backend...');
    // Initialize auth state by checking with the backend
    store.dispatch(checkAuthStatus());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}