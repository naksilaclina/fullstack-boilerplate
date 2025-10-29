const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // Include cookies in the request
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to refresh token");
    }

    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if the access token is expired by making a simple request
 */
export async function isAccessTokenExpired(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      credentials: "include",
    });
    
    // If we get a 401, the token is likely expired
    if (response.status === 401) {
      return true;
    }
    
    return false;
  } catch (error) {
    // If there's a network error, we can't determine token status
    return false;
  }
}