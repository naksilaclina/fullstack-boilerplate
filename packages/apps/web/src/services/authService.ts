const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthResponse {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  accessToken: string;
}

interface RefreshResponse {
  message: string;
  accessToken: string;
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
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  console.log("Attempting to login", { email: credentials.email });
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies in the request
      body: JSON.stringify(credentials),
    });

    console.log("Login response received", { 
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Login failed", { 
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
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
    console.log("Login successful", data);
    return data;
  } catch (error) {
    console.error("Login error", error);
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
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies in the request
    body: JSON.stringify(data),
  });

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
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include", // Include cookies in the request
  });

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
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<RefreshResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include", // Include cookies in the request
  });

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 401) {
      throw new Error("Session expired. Please login again.");
    }
    throw new Error(error.error || "Failed to refresh session. Please login again.");
  }

  return await response.json();
}

/**
 * Get current user profile
 */
export async function getProfile(accessToken: string): Promise<AuthResponse["user"]> {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    // Provide more descriptive error messages
    if (response.status === 401) {
      throw new Error("Your session has expired. Please login again.");
    } else if (response.status === 403) {
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
  const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
    method: "GET",
    credentials: "include", // Include cookies in the request
  });

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
  const response = await fetch(`${API_BASE_URL}/auth/sessions/${sessionId}`, {
    method: "DELETE",
    credentials: "include", // Include cookies in the request
  });

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
  const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
    method: "DELETE",
    credentials: "include", // Include cookies in the request
  });

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