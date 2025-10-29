// Role definitions and hierarchy for the application

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

// Define role hierarchy (higher index = higher privilege)
export const ROLE_HIERARCHY = [
  UserRole.USER,
  UserRole.ADMIN,
] as const;

// Check if a user has a specific role or higher privilege
export function hasRole(userRole: string, requiredRole: UserRole): boolean {
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole as UserRole);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  
  // If either role is not in hierarchy, deny access
  if (userRoleIndex === -1 || requiredRoleIndex === -1) {
    return false;
  }
  
  // User has access if their role index is greater than or equal to required role index
  return userRoleIndex >= requiredRoleIndex;
}

// Check if a user has any of the allowed roles
export function hasAnyRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.some(role => hasRole(userRole, role));
}

// Get the default redirect path for a user role
export function getDefaultRedirectPath(userRole: UserRole): string {
  switch (userRole) {
    case UserRole.ADMIN:
      return "/dashboard";
    case UserRole.USER:
      return "/user";
    default:
      return "/";
  }
}