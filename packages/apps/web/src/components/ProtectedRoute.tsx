"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { refreshAccessToken } from "@/services/authService";
import { toastService } from "@/services/toastService";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, accessToken, logout, setAccessToken } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      // If user is not authenticated, redirect to login
      if (!isAuthenticated) {
        toastService.error({
          message: "Authentication Required",
          description: "Please log in to access this page.",
        });
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
          toastService.error({
            message: "Session Expired",
            description: "Your session has expired. Please log in again.",
          });
          logout();
          router.push("/login");
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, accessToken, logout, setAccessToken, router]);

  // If user is not authenticated or there's no access token, don't render children
  if (!isAuthenticated || !accessToken) {
    return null;
  }

  return <>{children}</>;
}