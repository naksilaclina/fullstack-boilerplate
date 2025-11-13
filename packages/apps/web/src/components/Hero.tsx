"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { NavbarButton } from "@/components/ui/resizable-navbar";
import { UserRole } from "@/lib";
import { useAppDispatch } from "@/store";
import { refreshAuthStatus } from "@/store/authSlice";

export default function Hero() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, isReady } = useAuth();

  // Check auth status on component mount to ensure session is still valid
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      // Try to refresh auth status if user appears unauthenticated
      dispatch(refreshAuthStatus());
    }
  }, [isReady, isAuthenticated, dispatch]);

  if (loading) {
    return (
      <div className="py-24">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Determine where to redirect authenticated users
  const getUserDashboardLink = () => {
    if (!isAuthenticated) return "/";
    if (user?.role === UserRole.ADMIN) return "/dashboard";
    if (user?.role === UserRole.USER) return "/user";
    return "/";
  };

  return (
    <div className="py-24">
      <h1 className="mb-4 text-center text-3xl font-bold">
        Welcome
      </h1>
      <p className="mb-10 text-center text-sm text-zinc-500">
        A personal web application.
      </p>
      {!isAuthenticated && (
        <div className="flex justify-center gap-4">
          <NavbarButton 
            href="/login" 
            variant="secondary"
          >
            Login
          </NavbarButton>
          <NavbarButton 
            href="/register" 
            variant="primary"
            className="!bg-black !text-white"
          >
            Register
          </NavbarButton>
        </div>
      )}
      {isAuthenticated && (
        <div className="flex justify-center gap-4">
          <NavbarButton 
            href={getUserDashboardLink()} 
            variant="secondary"
          >
            Go to My Dashboard
          </NavbarButton>
        </div>
      )}
    </div>
  );
}