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

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function RoleProtectedRoute({
  children,
  allowedRoles
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuth();
  // We're not using isCheckingAuth anymore since we're using the loading state from Redux

  useEffect(() => {
    console.log('RoleProtectedRoute checkAuth called with state:', {
      user,
      isAuthenticated,
      allowedRoles
    });

    const checkAuth = async () => {
      // If user is not authenticated, try to check auth status with server
      if (!isAuthenticated) {
        console.log('User not authenticated in RoleProtectedRoute, checking auth status with server');
        try {
          const result = await dispatch(checkAuthStatus());
          if (checkAuthStatus.fulfilled.match(result)) {
            // User is authenticated, no need to do anything else
            console.log('User is authenticated');
          } else if (checkAuthStatus.rejected.match(result)) {
            // If checking auth status fails, redirect to login
            console.log('Failed to check auth status in RoleProtectedRoute, redirecting to login');
            router.push("/login");
            return;
          }
        } catch (error) {
          // If checking auth status fails, redirect to login
          console.log('Failed to check auth status in RoleProtectedRoute, redirecting to login');
          router.push("/login");
          return;
        }
      }
      
      // Check if user has the required role
      // Type assertion to handle the Omit<User, "email"> type
      if (user && !authorizationService.isRouteAccessible(user as User, allowedRoles)) {
        toastService.error({
          message: "Access Denied",
          description: `You don't have permission to access this page. Your role is ${user.role}.`
        });
        // Redirect to user's default page
        const redirectPath = authorizationService.getAccessDeniedRedirectPath(user as User);
        router.push(redirectPath);
        return;
      }
    };

    checkAuth();
  }, [isAuthenticated, dispatch, user, allowedRoles, router]);

  // If user is not authenticated or doesn't have the required role, don't render children
  console.log('RoleProtectedRoute rendering with state:', {
    user,
    isAuthenticated,
    allowedRoles,
    isAccessible: authorizationService.isRouteAccessible(user as User, allowedRoles)
  });
  
  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }
  
  if (!authorizationService.isRouteAccessible(user as User, allowedRoles)) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}