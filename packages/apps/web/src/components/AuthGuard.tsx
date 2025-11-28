"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { toastService } from "@/services/ui";
import { authorizationService } from "@/services/auth";
import { UserRole } from "@/lib";
import type { User } from "@/store/types";
import { useAppDispatch } from "@/store";
import { refreshAuthStatus } from "@/store/authSlice";

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
  const refreshAttemptedRef = useRef(false);

  useEffect(() => {
    // Wait for auth state to be ready
    if (!isReady) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated && !isLoading) {
      // Only attempt refresh once per mount
      if (refreshAttemptedRef.current) {
        console.log('🔄 AuthGuard: Refresh already attempted, redirecting to login');
        toastService.error({
          message: "Authentication Required",
          description: "Please log in to access this page."
        });
        router.push("/login");
        return;
      }

      // Mark that we've attempted refresh
      refreshAttemptedRef.current = true;

      console.log('🔄 AuthGuard: Attempting token refresh');
      // Try to refresh the auth status first
      dispatch(refreshAuthStatus())
        .unwrap()
        .then(() => {
          // Refresh successful, user is authenticated
          console.log('✅ AuthGuard: Token refresh successful');
          refreshAttemptedRef.current = false; // Reset for future checks
        })
        .catch((error) => {
          // Refresh failed, redirect to login
          console.log('🔄 AuthGuard: Token refresh failed, redirecting to login', error);
          toastService.error({
            message: "Authentication Required",
            description: "Please log in to access this page."
          });
          router.push("/login");
        });
      return;
    }

    // Reset refresh attempt flag when user becomes authenticated
    if (isAuthenticated) {
      refreshAttemptedRef.current = false;
    }

    // If user is authenticated and roles are specified, check authorization
    if (isAuthenticated && allowedRoles && user) {
      const isAccessible = authorizationService.isRouteAccessible(user as User, allowedRoles);

      if (!isAccessible) {
        console.log('🚫 AuthGuard: Access denied - insufficient permissions');
        toastService.error({
          message: "Access Denied",
          description: "You don't have permission to access this page."
        });
        router.push(authorizationService.getAccessDeniedRedirectPath(user as User));
        return;
      }
    }
  }, [isReady, isAuthenticated, isLoading, allowedRoles, user, router, dispatch, requireAuth]);

  // Show loading state while auth is initializing
  // Also show loading state when we're checking authentication but not yet authenticated
  if (!isReady || (requireAuth && !isAuthenticated && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Render children when auth is ready
  return <>{children}</>;
}
