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
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Determine where to redirect authenticated users
  const getUserDashboardLink = () => {
    if (!isAuthenticated) return "/";
    if (user?.role === UserRole.ADMIN) return "/admin";
    if (user?.role === UserRole.USER) return "/user";
    return "/";
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4 py-8 text-center">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
          Welcome to MyApp
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
          A modern personal web application built with cutting-edge technologies for seamless user experience.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {!isAuthenticated ? (
            <>
              <NavbarButton 
                href="/login" 
                variant="secondary"
                className="px-8 py-3 text-base"
              >
                Login
              </NavbarButton>
              <NavbarButton 
                href="/register" 
                variant="primary"
                className="px-8 py-3 text-base !bg-black !text-white"
              >
                Get Started
              </NavbarButton>
            </>
          ) : (
            <NavbarButton 
              href={getUserDashboardLink()} 
              variant="secondary"
              className="px-8 py-3 text-base"
            >
              Go to My Dashboard
            </NavbarButton>
          )}
        </div>
      </div>
      
      <div className="mt-12 w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-lg mb-2">Secure Authentication</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enterprise-grade security with encrypted sessions and secure token management.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-lg mb-2">Responsive Design</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Fully responsive interface that works seamlessly on all devices and screen sizes.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-lg mb-2">Modern Features</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Built with the latest web technologies for optimal performance and user experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}