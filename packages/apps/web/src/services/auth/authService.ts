import { apiClient } from '@/utils/apiClient';
import type { User } from '@/store/types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  timezone?: string;
  locale?: string;
}

interface AuthResponse {
  message: string;
  user: User;
}

interface Session {
  id: string;
  createdAt: string;
  userAgent?: string;
  ipAddr?: string;
  expiresAt: string;
}

interface SessionsResponse {
  message: string;
  sessions: Session[];
}

/**
 * Refresh auth tokens
 */
export async function refreshAuth(): Promise<boolean> {
  try {
    // Use apiClient instead of direct fetch to ensure CSRF token is included
    const response = await apiClient.post("/auth/refresh");
    
    if (!response.ok) {
      console.log('❌ refreshAuth: Refresh request failed', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
    } else {
      console.log('✅ refreshAuth: Refresh request successful');
    }
    
    return response.ok;
  } catch (error) {
    console.log('❌ refreshAuth: Failed to refresh tokens', error);
    // If it's a network error, we might want to retry
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      // Network error - could be temporary
      console.log('🔄 refreshAuth: Network error, might be temporary');
    }
    return false;
  }
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await apiClient.post("/auth/login", credentials);

    if (!response.ok) {
      const errorText = await response.text();
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        error = { error: errorText || "Failed to login" };
      }
      
      // Provide more descriptive error messages
      if (response.status === 401) {
        throw new Error("Invalid email or password. Please check your credentials and try again.");
      } else if (response.status === 400) {
        throw new Error("Please provide both email and password to login.");
      } else if (response.status === 429) {
        throw new Error("Too many login attempts. Please try again later.");
      }
      throw new Error(error.error || "Failed to login. Please try again later.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Failed to connect to the server. Please check your internet connection and try again.");
    }
    throw error;
  }
}

/**
 * Register user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.post("/auth/register", data);

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 400) {
      throw new Error("Please fill in all required fields correctly.");
    } else if (response.status === 409) {
      throw new Error("An account with this email already exists. Please use a different email or login instead.");
    } else if (response.status === 429) {
      throw new Error("Too many registration attempts. Please try again later.");
    }
    throw new Error(error.error || "Failed to register. Please try again later.");
  }

  return await response.json();
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const response = await apiClient.post("/auth/logout");

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 401) {
      throw new Error("You are not logged in. Please login first.");
    }
    throw new Error(error.error || "Failed to logout. Please try again later.");
  }

  return await response.json();
}

/**
 * Get current user profile with automatic token refresh
 */
export async function getProfile(): Promise<AuthResponse["user"]> {
  const response = await apiClient.get("/auth/profile");

  if (!response.ok) {
    // For 401 errors during auth check, throw a simple error without detailed message
    // This is expected when user is not logged in
    if (response.status === 401) {
      throw new Error("UNAUTHENTICATED");
    }
    
    const error = await response.json();
    // Provide more descriptive error messages for other errors
    if (response.status === 403) {
      throw new Error("Access denied. You don't have permission to view this information.");
    }
    throw new Error(error.error || "Failed to get profile information. Please try again later.");
  }

  return await response.json();
}

/**
 * Get all active sessions for the current user
 */
export async function getSessions(): Promise<SessionsResponse> {
  const response = await apiClient.get("/auth/sessions");

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 401) {
      throw new Error("You are not logged in. Please login first.");
    }
    throw new Error(error.error || "Failed to get sessions. Please try again later.");
  }

  return await response.json();
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const response = await apiClient.delete(`/auth/sessions/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 401) {
      throw new Error("You are not logged in. Please login first.");
    } else if (response.status === 404) {
      throw new Error("Session not found.");
    }
    throw new Error(error.error || "Failed to revoke session. Please try again later.");
  }

  return await response.json();
}

/**
 * Revoke all sessions except the current one
 */
export async function revokeAllSessions(): Promise<void> {
  const response = await apiClient.delete("/auth/sessions");

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 401) {
      throw new Error("You are not logged in. Please login first.");
    }
    throw new Error(error.error || "Failed to revoke sessions. Please try again later.");
  }

  return await response.json();
}