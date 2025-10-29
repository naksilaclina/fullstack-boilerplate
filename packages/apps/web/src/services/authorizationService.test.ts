import { authorizationService } from "./authorizationService";
import { UserRole } from "@/lib/roles";

// Mock user objects for testing
const mockAdminUser = {
  id: "1",
  firstName: "Admin",
  lastName: "User",
  role: "admin"
} as any;

const mockRegularUser = {
  id: "2",
  firstName: "Regular",
  lastName: "User",
  role: "user"
} as any;

const mockInvalidUser = {
  id: "3",
  firstName: "Invalid",
  lastName: "User",
  role: "invalid"
} as any;

describe("AuthorizationService", () => {
  describe("hasRole", () => {
    it("should return true when user has the exact required role", () => {
      expect(authorizationService.hasRole(mockAdminUser, UserRole.ADMIN)).toBe(true);
      expect(authorizationService.hasRole(mockRegularUser, UserRole.USER)).toBe(true);
    });

    it("should return true when user has higher privilege than required role", () => {
      expect(authorizationService.hasRole(mockAdminUser, UserRole.USER)).toBe(true);
    });

    it("should return false when user has lower privilege than required role", () => {
      expect(authorizationService.hasRole(mockRegularUser, UserRole.ADMIN)).toBe(false);
    });

    it("should return false when user has invalid role", () => {
      expect(authorizationService.hasRole(mockInvalidUser, UserRole.USER)).toBe(false);
      expect(authorizationService.hasRole(mockInvalidUser, UserRole.ADMIN)).toBe(false);
    });

    it("should return false when user is null", () => {
      expect(authorizationService.hasRole(null, UserRole.USER)).toBe(false);
      expect(authorizationService.hasRole(null, UserRole.ADMIN)).toBe(false);
    });
  });

  describe("hasAnyRole", () => {
    it("should return true when user has any of the allowed roles", () => {
      expect(authorizationService.hasAnyRole(mockAdminUser, [UserRole.USER, UserRole.ADMIN])).toBe(true);
      expect(authorizationService.hasAnyRole(mockRegularUser, [UserRole.USER, UserRole.ADMIN])).toBe(true);
    });

    it("should return false when user doesn't have any of the allowed roles", () => {
      expect(authorizationService.hasAnyRole(mockRegularUser, [UserRole.ADMIN])).toBe(false);
    });

    it("should return false when user is null", () => {
      expect(authorizationService.hasAnyRole(null, [UserRole.USER, UserRole.ADMIN])).toBe(false);
    });
  });

  describe("isRouteAccessible", () => {
    it("should return true when no roles are specified and user is authenticated", () => {
      expect(authorizationService.isRouteAccessible(mockAdminUser)).toBe(true);
      expect(authorizationService.isRouteAccessible(mockRegularUser)).toBe(true);
    });

    it("should return false when no roles are specified and user is not authenticated", () => {
      expect(authorizationService.isRouteAccessible(null)).toBe(false);
    });

    it("should return true when user has any of the allowed roles", () => {
      expect(authorizationService.isRouteAccessible(mockAdminUser, [UserRole.ADMIN])).toBe(true);
      expect(authorizationService.isRouteAccessible(mockAdminUser, [UserRole.USER, UserRole.ADMIN])).toBe(true);
      expect(authorizationService.isRouteAccessible(mockRegularUser, [UserRole.USER])).toBe(true);
    });

    it("should return false when user doesn't have any of the allowed roles", () => {
      expect(authorizationService.isRouteAccessible(mockRegularUser, [UserRole.ADMIN])).toBe(false);
    });
  });

  describe("getAccessDeniedRedirectPath", () => {
    it("should redirect to login when user is not authenticated", () => {
      expect(authorizationService.getAccessDeniedRedirectPath(null)).toBe("/login");
    });

    it("should redirect to appropriate page based on user role", () => {
      expect(authorizationService.getAccessDeniedRedirectPath(mockAdminUser)).toBe("/dashboard");
      expect(authorizationService.getAccessDeniedRedirectPath(mockRegularUser)).toBe("/user");
    });
  });
});