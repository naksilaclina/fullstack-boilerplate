"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { toastService } from "@/services/ui";
import { authorizationService } from "@/services/auth";
import { UserRole } from "@/lib";
import type { User } from "@/store/authSlice";
import { useAppDispatch } from "@/store";
import { checkAuthStatus, refreshAuthStatus } from "@/store/authSlice";
import { authManager } from "@/utils";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean; // Default true, set false for public routes with optional auth
}

export default function AuthGuard({
  children,
  allowedRoles,
  requireAuth = true
}: AuthGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, isReady } = useAuth();

  useEffect(() => {
    // Only dispatch auth check if:
    // 1. Auth state is ready (not initializing)
    // 2. User is not authenticated
    // 3. Not already loading
    console.log('🔄 AuthGuard: useEffect triggered', { isReady, isAuthenticated, isLoading });
    
    // During initial load, don't initiate auth checks as ReduxProvider handles this
    // Only check auth after the initial auth state has been determined by ReduxProvider
    if (isReady && !isAuthenticated && !isLoading) {
      console.log('🔄 AuthGuard: Dispatching auth check', { isReady, isAuthenticated, isLoading });
      // Add error handling for the auth check
      authManager.checkAuth(dispatch, checkAuthStatus).catch((error) => {
        console.log('❌ AuthGuard: Auth check failed', error);
        // If it's a race condition error, we can ignore it as the ReduxProvider is handling it
        if (error && error.payload !== 'Auth check already in progress' && error.payload !== 'UNAUTHENTICATED') {
          // For other errors, we might want to handle them
          console.warn('AuthGuard: Unexpected auth error', error);
        }
      });
    } else {
      console.log('🔄 AuthGuard: Skipping auth check', { isReady, isAuthenticated, isLoading });
    }
  }, [isReady, isAuthenticated, isLoading, dispatch]);

  useEffect(() => {
    // Wait for auth state to be ready
    if (!isReady) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      // Try to refresh the auth status first
      dispatch(refreshAuthStatus())
        .unwrap()
        .then(() => {
          // Refresh successful, user is authenticated
          console.log('🔄 AuthGuard: Token refresh successful');
        })
        .catch((error) => {
          // Refresh failed, redirect to login
          console.log('🔄 AuthGuard redirecting to login - authentication required', error);
          toastService.error({
            message: "Authentication Required",
            description: "Please log in to access this page."
          });
          router.push("/login");
        });
      return;
    }

    // If user is authenticated and roles are specified, check authorization
    if (isAuthenticated && allowedRoles && user) {
      const isAccessible = authorizationService.isRouteAccessible(user as User, allowedRoles);
      
      if (!isAccessible) {
        console.log('🚫 AuthGuard redirecting to access denied - insufficient permissions');
        toastService.error({
          message: "Access Denied",
          description: "You don't have permission to access this page."
        });
        router.push(authorizationService.getAccessDeniedRedirectPath(user as User));
        return;
      }
    }
  }, [isReady, isAuthenticated, allowedRoles, user, router, dispatch, requireAuth]);

  // Always render children - no loading state to prevent hydration errors
  return <>{children}</>;
}