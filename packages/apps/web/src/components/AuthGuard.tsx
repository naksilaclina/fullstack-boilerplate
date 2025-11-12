"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { toastService } from "@/services/toastService";
import { authorizationService } from "@/services/authorizationService";
import { UserRole } from "@/lib";
import type { User } from "@/store/authSlice";
import { useAppDispatch } from "@/store";
import { checkAuthStatus } from "@/store/authSlice";
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
    // Only dispatch auth check if not already loading/initializing and not authenticated
    if (!isReady && !isAuthenticated && !isLoading) {
      authManager.checkAuth(dispatch, checkAuthStatus);
    }
  }, [isReady, isAuthenticated, isLoading, dispatch]);

  useEffect(() => {
    // Wait for auth state to be ready
    if (!isReady) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      console.log('🔄 AuthGuard redirecting to login - authentication required');
      toastService.error({
        message: "Authentication Required",
        description: "Please log in to access this page."
      });
      router.push("/login");
      return;
    }

    // If user is authenticated and roles are specified, check authorization
    if (isAuthenticated && allowedRoles && user) {
      const isAccessible = authorizationService.isRouteAccessible(user as User, allowedRoles);
      
      if (!isAccessible) {
        toastService.error({
          message: "Access Denied",
          description: `You don't have permission to access this page. Your role is ${user.role}.`
        });
        const redirectPath = authorizationService.getAccessDeniedRedirectPath(user as User);
        console.log('🔄 AuthGuard redirecting due to insufficient permissions');
        router.push(redirectPath);
        return;
      }
    }
  }, [isReady, isAuthenticated, user, allowedRoles, requireAuth, router]);

  // Show loading state while auth is being determined
  if (isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state for unauthenticated users on protected routes
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show access denied state for authenticated users without proper roles
  if (isAuthenticated && allowedRoles && user && !authorizationService.isRouteAccessible(user as User, allowedRoles)) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}