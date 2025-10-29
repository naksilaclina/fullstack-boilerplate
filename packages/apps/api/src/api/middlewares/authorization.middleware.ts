import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "~api/services/auth/jwt.utils";

// Define role hierarchy
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

// Type guard to check if user has role property
function isJwtPayloadWithRole(payload: JwtPayload): payload is JwtPayload & { role: string } {
  return typeof payload === 'object' && payload !== null && 'role' in payload;
}

/**
 * Authorization middleware to check if user has required role
 * @param requiredRole - The minimum role required to access the route
 */
export function authorize(requiredRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: "Access denied. User not authenticated.",
        });
      }

      // Check if user has required role
      if (!isJwtPayloadWithRole(req.user) || !hasRequiredRole(req.user.role as UserRole, requiredRole)) {
        return res.status(403).json({
          error: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: "Internal server error during authorization.",
      });
    }
  };
}

/**
 * Check if user has required role based on role hierarchy
 * @param userRole - The role of the authenticated user
 * @param requiredRole - The minimum role required to access the resource
 * @returns boolean - Whether the user has sufficient permissions
 */
function hasRequiredRole(userRole: string, requiredRole: UserRole): boolean {
  // Define role hierarchy (higher index = higher privilege)
  const roleHierarchy = [UserRole.USER, UserRole.ADMIN];
  
  const userRoleIndex = roleHierarchy.indexOf(userRole as UserRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  
  // If either role is not in hierarchy, deny access
  if (userRoleIndex === -1 || requiredRoleIndex === -1) {
    return false;
  }
  
  // User has access if their role index is greater than or equal to required role index
  return userRoleIndex >= requiredRoleIndex;
}