"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { toastService } from "@/services/toastService";
import { authorizationService } from "@/services/authorizationService";
import { UserRole } from "@/lib/roles";
import type { User } from "@/store/authSlice";
import { useAppDispatch } from "@/store";
import { checkAuthStatus } from "@/store/authSlice";
import { authManager } from "@/utils/authManager";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles 
}: ProtectedRouteProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, initializing } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      // Only check auth if we're not already loading and not authenticated
      if (!isAuthenticated && !loading && !initializing) {
        try {
          const result = await authManager.checkAuth(dispatch, checkAuthStatus);
          if (result && checkAuthStatus.rejected.match(result)) {
            // If checking auth status fails, redirect to login
            toastService.error({
              message: "Authentication Required", 
              description: "Please log in to access this page.",
            });
            console.log('🔄 ProtectedRoute redirecting to login - auth check failed');
            router.push("/login");
            return;
          }
        } catch (error) {
          // If checking auth status fails, redirect to login
          console.log('🔄 ProtectedRoute redirecting to login - auth check error:', error);
          toastService.error({
            message: "Authentication Required",
            description: "Please log in to access this page.",
          });
          router.push("/login");
          return;
        }
      }
      
      // If roles are specified, check if user has the required role
      if (allowedRoles && user && !authorizationService.isRouteAccessible(user as User, allowedRoles)) {
        toastService.error({
          message: "Access Denied",
          description: `You don't have permission to access this page. Your role is ${user.role}.`,
        });
        
        // Redirect to user's default page
        const redirectPath = authorizationService.getAccessDeniedRedirectPath(user as User);
        router.push(redirectPath);
        return;
      }
    };

    checkAuth();
  }, [isAuthenticated, loading, initializing, dispatch, router, user, allowedRoles]);

  // If user is not authenticated, don't render children
  
  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  // If roles are specified, check if user has the required role
  if (allowedRoles && !authorizationService.isRouteAccessible(user as User, allowedRoles)) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}