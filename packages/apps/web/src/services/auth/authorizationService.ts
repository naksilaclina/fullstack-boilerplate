import { UserRole, hasRole, hasAnyRole } from "@/lib";
import type { User } from "@/store/types";
import { getAccessDeniedRedirectPathForRole, getPostLoginRedirectPath, getRedirectPathForRole } from "@/utils";

// Authorization service to handle role-based access control
class AuthorizationService {
  // Check if user has a specific role or higher privilege
  hasRole(user: User | null, requiredRole: UserRole): boolean {
    if (!user || !user.role) {
      return false;
    }
    return hasRole(user.role, requiredRole);
  }

  // Check if user has any of the allowed roles
  hasAnyRole(user: User | null, allowedRoles: UserRole[]): boolean {
    if (!user || !user.role) {
      return false;
    }
    return hasAnyRole(user.role, allowedRoles);
  }

  // Get the default redirect path for a user
  getDefaultRedirectPath(user: User): string {
    return getRedirectPathForRole(user.role as UserRole);
  }

  // Get redirect path after login based on user role
  getPostLoginRedirectPath(user: User): string {
    return getPostLoginRedirectPath(user.role as UserRole);
  }

  // Get redirect path when access is denied
  getAccessDeniedRedirectPath(user: User | null): string {
    // If user is not authenticated, redirect to login
    if (!user) {
      return "/login";
    }
    
    // Redirect to user's default page
    return getAccessDeniedRedirectPathForRole(user.role as UserRole);
  }

  // Check if current route is accessible to user
  isRouteAccessible(user: User | null, allowedRoles?: UserRole[]): boolean {
    // If no roles specified, only authentication is required
    if (!allowedRoles || allowedRoles.length === 0) {
      return !!user;
    }
    
    // Check if user has any of the allowed roles
    return this.hasAnyRole(user, allowedRoles);
  }
}

// Export singleton instance
export const authorizationService = new AuthorizationService();