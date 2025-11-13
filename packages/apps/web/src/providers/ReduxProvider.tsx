"use client";

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { checkAuthStatus, refreshAuthStatus } from '@/store/authSlice';
import { authManager } from '@/utils';
import { apiClient } from '@/utils/apiClient';

// Global flag to indicate when ReduxProvider has finished initializing auth
let isReduxProviderAuthInitialized = false;

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize CSRF protection
    const initCsrf = async () => {
      try {
        await apiClient.initCsrfProtection();
        console.log('✅ CSRF protection initialized');
      } catch (error) {
        console.error('❌ Failed to initialize CSRF protection:', error);
      }
    };
    
    initCsrf();
    
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
        // If initial auth check fails with UNAUTHENTICATED, only try to refresh tokens 
        // if we're not on the login page
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath === '/login' || currentPath === '/login/';
        
        if (error.payload === 'UNAUTHENTICATED' && !isLoginPage) {
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
    
    // Set up periodic auth status check
    const interval = setInterval(() => {
      // Only check if we're not on the login page and auth has been initialized
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === '/login' || currentPath === '/login/';
      
      if (isReduxProviderAuthInitialized && !isLoginPage) {
        store.dispatch(checkAuthStatus());
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return <Provider store={store}>{children}</Provider>;
}