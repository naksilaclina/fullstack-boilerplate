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
// Updated to accept current path to determine appropriate redirect
export function getPostLogoutRedirectPath(currentPath: string = "/"): string {
  // Define protected routes that require authentication
  const protectedRoutes = [
    "/admin",
    "/user"
  ];
  
  // Check if current path starts with any protected route
  const isOnProtectedRoute = protectedRoutes.some(route => 
    currentPath.startsWith(route)
  );
  
  // If on a protected route, redirect to login
  // Otherwise, stay on the current page
  return isOnProtectedRoute ? "/login" : currentPath;
}

// Get redirect path when access is denied
export function getAccessDeniedRedirectPathForRole(userRole: UserRole): string {
  return getRedirectPathForRole(userRole);
}