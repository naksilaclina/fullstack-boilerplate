"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/authService";
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
  const { user, isAuthenticated, login, logout } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    console.log('RoleProtectedRoute checkAuth called with state:', {
      user,
      isAuthenticated,
      allowedRoles
    });
    
    const checkAuth = async () => {
      // If user is not authenticated, try to get profile from server
      if (!isAuthenticated) {
        console.log('User not authenticated in RoleProtectedRoute, trying to get profile');
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
          console.log('Failed to get profile in RoleProtectedRoute, redirecting to login');
          router.push("/login");
          setIsCheckingAuth(false);
          return;
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
          router.push("/dashboard");
        } else {
          router.push("/user");
        }
        setIsCheckingAuth(false);
        return; // Important: return early to prevent further execution
      }
      
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [isAuthenticated, user, allowedRoles, login, logout, router]);

  // If we're still checking auth, don't render anything
  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  // If user is not authenticated or doesn't have the required role, don't render children
  console.log('RoleProtectedRoute rendering with state:', {
    user,
    isAuthenticated,
    allowedRoles,
    hasRequiredRole: allowedRoles && user && allowedRoles.includes(user.role),
    shouldRender: isAuthenticated && (!allowedRoles || (user && allowedRoles.includes(user.role)))
  });
  
  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}