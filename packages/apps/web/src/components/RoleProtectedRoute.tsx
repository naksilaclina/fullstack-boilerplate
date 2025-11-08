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
  const { user, isAuthenticated, isLoading, isReady } = useAuth();

  useEffect(() => {
    // Only dispatch if not already loading/initializing and not authenticated
    if (!isReady && !isAuthenticated && !isLoading) {
      authManager.checkAuth(dispatch, checkAuthStatus);
    }
  }, [isReady, isAuthenticated, isLoading, dispatch]);

  useEffect(() => {
    // Auth state hazır olduğunda kontrolleri yap
    if (isReady) {
      // Authenticated değilse login'e yönlendir
      if (!isAuthenticated) {
        console.log('🔄 RoleProtectedRoute redirecting to login - not authenticated');
        router.push("/login");
        return;
      }

      // Role kontrolü yap
      const isAccessible = authorizationService.isRouteAccessible(user as User, allowedRoles);

      if (user && !isAccessible) {
        toastService.error({
          message: "Access Denied",
          description: `You don't have permission to access this page. Your role is ${user.role}.`
        });
        const redirectPath = authorizationService.getAccessDeniedRedirectPath(user as User);
        router.push(redirectPath);
        return;
      }
    }
  }, [isReady, isAuthenticated, user, allowedRoles, router]);

  // Loading state'i göster
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

  // Auth state hazır ama authenticated değil
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Role kontrolü
  if (!authorizationService.isRouteAccessible(user as User, allowedRoles)) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Her şey tamam, children'ı render et
  return <>{children}</>;
}