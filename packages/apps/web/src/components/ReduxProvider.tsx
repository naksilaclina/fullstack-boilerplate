"use client";

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { initAuthState } from '@/store/authSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('Initializing auth state from localStorage...');
    // Initialize auth state from localStorage when the app loads
    store.dispatch(initAuthState());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}