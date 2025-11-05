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
  const { user, isAuthenticated, isLoading, isReady } = useAuth();

  // Her render'da state'i logla
  console.log('🔒 RoleProtectedRoute RENDER:', {
    user: user ? { id: user.id, email: user.email, role: user.role } : null,
    isAuthenticated,
    isLoading,
    isReady,
    allowedRoles,
    timestamp: new Date().toISOString()
  });

  // Terminal'de de görmek için
  if (typeof window !== 'undefined') {
    console.info('[CLIENT] 🔒 RoleProtectedRoute RENDER:', {
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      isAuthenticated,
      isLoading,
      isReady,
      allowedRoles
    });
  }

  useEffect(() => {
    console.log('🔄 RoleProtectedRoute useEffect [AUTH CHECK]:', {
      isReady,
      isAuthenticated,
      shouldCheckAuth: !isReady && !isAuthenticated
    });
    
    // Sadece ready olmadığında ve background validation yapmadığımızda çalıştır
    if (!isReady && !isAuthenticated) {
      console.log('🌐 RoleProtectedRoute: Dispatching checkAuthStatus...');
      dispatch(checkAuthStatus());
    }
  }, [isReady, isAuthenticated, dispatch]);

  useEffect(() => {
    console.log('🔄 RoleProtectedRoute useEffect [PERMISSIONS CHECK]:', {
      isReady,
      isAuthenticated,
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      allowedRoles
    });

    // Auth state hazır olduğunda kontrolleri yap
    if (isReady) {
      console.log('✅ RoleProtectedRoute: Auth state ready, checking permissions');

      // Authenticated değilse login'e yönlendir
      if (!isAuthenticated) {
        console.log('❌ RoleProtectedRoute: User not authenticated, redirecting to login');
        router.push("/login");
        return;
      }

      // Role kontrolü yap
      const isAccessible = authorizationService.isRouteAccessible(user as User, allowedRoles);
      console.log('🔐 RoleProtectedRoute: Access check result:', {
        user: user ? { role: user.role } : null,
        allowedRoles,
        isAccessible
      });

      if (user && !isAccessible) {
        console.log('🚫 RoleProtectedRoute: Access denied, redirecting');
        toastService.error({
          message: "Access Denied",
          description: `You don't have permission to access this page. Your role is ${user.role}.`
        });
        const redirectPath = authorizationService.getAccessDeniedRedirectPath(user as User);
        router.push(redirectPath);
        return;
      }

      if (isAuthenticated && isAccessible) {
        console.log('🎉 RoleProtectedRoute: All checks passed, rendering children');
      }
    }
  }, [isReady, isAuthenticated, user, allowedRoles, router]);

  // Loading state'i göster
  if (isLoading || !isReady) {
    console.log('⏳ RoleProtectedRoute: Rendering loading state');
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
    console.log('🔄 RoleProtectedRoute: Rendering redirect to login state');
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
    console.log('🚫 RoleProtectedRoute: Rendering access denied state');
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Her şey tamam, children'ı render et
  console.log('🎯 RoleProtectedRoute: Rendering children - SUCCESS!');
  return <>{children}</>;
}