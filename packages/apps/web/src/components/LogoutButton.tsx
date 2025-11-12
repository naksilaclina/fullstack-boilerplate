"use client";

import { useRouter } from "next/navigation";
import { NavbarButton } from "@/components/ui/resizable-navbar";
import { useAuth } from "@/hooks/auth/useAuth";
import { logout as logoutService } from "@/services/authService";
import { toastService } from "@/services/toastService";
import { getPostLogoutRedirectPath } from "@/utils";

export default function LogoutButton() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutService();
      logout();
      toastService.success({
        message: "Logout Successful",
        description: "You have been successfully logged out.",
      });
      router.push(getPostLogoutRedirectPath());
    } catch (error: any) {
      // Even if the API call fails, we still log out the user locally
      logout();
      toastService.success({
        message: "Logged Out",
        description: "You have been logged out (local only).",
      });
      router.push(getPostLogoutRedirectPath());
    }
  };

  // Don't render the button if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <NavbarButton variant="secondary" onClick={handleLogout}>
      Logout
    </NavbarButton>
  );
}