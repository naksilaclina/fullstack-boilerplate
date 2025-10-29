"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { NavbarButton } from "@/components/ui/resizable-navbar";
import { UserRole } from "@/lib/roles";

export default function Hero() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  // Removed the useEffect that was automatically redirecting authenticated users
  // The home page should be accessible to all users, including authenticated ones
  // Users can navigate to their respective pages using the navigation menu

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