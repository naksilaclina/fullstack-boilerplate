"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { refreshAccessToken } from "@/services/authService";
import { toastService } from "@/services/toastService";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function RoleProtectedRoute({ 
  children, 
  allowedRoles 
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, accessToken, logout, setAccessToken } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      // If user is not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // If there's no access token, try to refresh it
      if (!accessToken) {
        try {
          const response = await refreshAccessToken();
          setAccessToken(response.accessToken);
        } catch (error) {
          // If refresh fails, log out the user
          logout();
          router.push("/login");
        }
      }

      // Check if user has the required role
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        toastService.error({
          message: "Access Denied",
          description: `You don't have permission to access this page. Your role is ${user.role}.`,
        });
        // Redirect based on user role
        if (user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/user");
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, user, accessToken, allowedRoles, logout, setAccessToken, router]);

  // If user is not authenticated, doesn't have the required role, 
  // or there's no access token, don't render children
  if (!isAuthenticated || !accessToken) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}