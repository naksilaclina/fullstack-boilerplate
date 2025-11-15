"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";
import { logout as logoutService } from "@/services/auth";
import { toastService } from "@/services/ui";
import { getPostLogoutRedirectPath } from "@/utils/redirectUtils";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({
  variant = "outline",
  size = "default",
  className = "",
  children = "Logout"
}: LogoutButtonProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutService();
      // Clear local auth state
      logout();
      
      toastService.success({
        message: "Logged Out",
        description: "You have been successfully logged out."
      });
      
      // Get appropriate redirect path based on current location
      const redirectPath = getPostLogoutRedirectPath(window.location.pathname);
      
      // Only redirect if path is different from current
      if (redirectPath !== window.location.pathname) {
        router.push(redirectPath);
        // Refresh the page to ensure clean state
        router.refresh();
      }
    } catch (error: any) {
      toastService.error({
        message: "Logout Failed",
        description: error.message || "Failed to logout. Please try again."
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
    >
      {children}
    </Button>
  );
}