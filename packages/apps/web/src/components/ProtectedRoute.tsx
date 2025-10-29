"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/authService";
import { toastService } from "@/services/toastService";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    console.log('ProtectedRoute checkAuth called with state:', {
      user,
      isAuthenticated
    });
    
    const checkAuth = async () => {
      // If user is not authenticated, try to get profile from server
      if (!isAuthenticated) {
        console.log('User not authenticated, trying to get profile');
        try {
          const profile = await getProfile();
          login({
            id: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.role
          });
        } catch (error) {
          // If getting profile fails, redirect to login
          console.log('Failed to get profile, redirecting to login');
          toastService.error({
            message: "Authentication Required",
            description: "Please log in to access this page.",
          });
          router.push("/login");
          setIsCheckingAuth(false);
          return;
        }
      }
      
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [isAuthenticated, login, logout, router, user]);

  // If we're still checking auth, don't render anything
  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  // If user is not authenticated, don't render children
  console.log('ProtectedRoute rendering with state:', {
    user,
    isAuthenticated,
    shouldRender: isAuthenticated
  });
  
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}