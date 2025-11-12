"use client";

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { checkAuthStatus, refreshAuthStatus } from '@/store/authSlice';
import { authManager } from '@/utils';

// Global flag to indicate when ReduxProvider has finished initializing auth
let isReduxProviderAuthInitialized = false;

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize auth only once using the auth manager
    const initAuth = async () => {
      console.log('🔄 ReduxProvider: Initializing auth...');
      // Reset auth manager state to ensure clean start
      authManager.reset();
      
      try {
        const result = await authManager.checkAuth(store.dispatch, checkAuthStatus);
        console.log('✅ ReduxProvider: Auth initialization successful', result);
        isReduxProviderAuthInitialized = true;
        // User is authenticated
      } catch (error: any) {
        console.log('❌ ReduxProvider: Auth initialization error', error);
        isReduxProviderAuthInitialized = true;
        // If initial auth check fails with UNAUTHENTICATED, try to refresh tokens
        if (error.payload === 'UNAUTHENTICATED') {
          // Try to refresh auth tokens
          try {
            console.log('🔄 ReduxProvider: Trying to refresh tokens...');
            const refreshResult = await store.dispatch(refreshAuthStatus()).unwrap();
            console.log('✅ ReduxProvider: Token refresh successful during initialization', refreshResult);
          } catch (refreshError) {
            console.log('❌ ReduxProvider: Token refresh failed during initialization', refreshError);
            // Silently handle unauthenticated state - this is expected
          }
        } else if (error.payload !== 'Auth check already in progress') {
          console.warn('Auth initialization error:', error);
        }
      }
    };
    
    initAuth();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}