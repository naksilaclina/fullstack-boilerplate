import { UserRole } from "@/lib";

// Utility functions for handling redirects based on user roles

// Get the appropriate redirect path based on user role
export function getRedirectPathForRole(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/admin";
    case UserRole.USER:
      return "/user";
    default:
      return "/";
  }
}

// Get redirect path after login based on user role
export function getPostLoginRedirectPath(role: UserRole): string {
  return getRedirectPathForRole(role);
}

// Get redirect path after logout
export function getPostLogoutRedirectPath(): string {
  return "/login";
}

// Get redirect path when access is denied
export function getAccessDeniedRedirectPathForRole(userRole: UserRole): string {
  return getRedirectPathForRole(userRole);
}