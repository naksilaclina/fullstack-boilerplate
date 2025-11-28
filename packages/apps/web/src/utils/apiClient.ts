// Track if we're currently refreshing token to prevent multiple simultaneous refreshes
let isRefreshing = false;
// Track requests that need to be retried after token refresh
let failedQueue: { resolve: (value: any) => void; reject: (reason?: any) => void }[] = [];

// Store CSRF token
let csrfToken: string | null = null;

// Custom error for token refresh failure
export class TokenRefreshError extends Error {
  constructor() {
    super('Token refresh failed');
    this.name = 'TokenRefreshError';
  }
}

/**
 * Fetch CSRF token from the server
 */
const fetchCsrfToken = async (): Promise<string | null> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
    const response = await fetch(`${baseUrl.replace('/api/v1', '/api')}/csrf-token`, {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

/**
 * Process the queue of failed requests after token refresh
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Direct refresh auth function to avoid circular dependency
 */
const directRefreshAuth = async (): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
    console.log('🔄 directRefreshAuth: Making POST request to refresh endpoint', {
      url: `${baseUrl}/auth/refresh`,
      timestamp: new Date().toISOString()
    });

    // Ensure we have CSRF token before refresh
    if (!csrfToken) {
      await fetchCsrfToken();
    }

    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      },
    });

    // Log response details
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      console.log('❌ directRefreshAuth: Refresh request failed', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        responseData
      });
    } else {
      console.log('✅ directRefreshAuth: Refresh request successful', {
        status: response.status,
        responseData
      });
    }

    return response.ok;
  } catch (error) {
    console.log('❌ directRefreshAuth: Failed to refresh tokens', error);
    return false;
  }
};

/**
 * Create an API client with automatic token refresh and CSRF protection
 */
class ApiClient {
  private baseUrl: string;
  private onAuthError: (() => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set a callback to be invoked when authentication fails (e.g. token refresh fails)
   */
  setAuthErrorCallback(callback: () => void) {
    this.onAuthError = callback;
  }

  /**
   * Initialize CSRF protection by fetching the token
   */
  async initCsrfProtection(): Promise<void> {
    await fetchCsrfToken();
  }

  /**
   * Make a fetch request with automatic token refresh and CSRF protection
   */
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    // Ensure we have a CSRF token for state-changing requests
    const method = init?.method?.toUpperCase() || 'GET';
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    if (isStateChanging && !csrfToken) {
      await fetchCsrfToken();
    }

    // Make the initial request
    let response = await fetch(input, {
      ...init,
      credentials: "include", // Always include credentials for auth
      headers: {
        ...(csrfToken && isStateChanging && { 'X-CSRF-Token': csrfToken }),
        ...init?.headers,
      },
    });

    // If unauthorized, try to refresh token
    // BUT only if this is NOT a login request, as login failures should not trigger token refresh
    const url = typeof input === 'string' ? input : input.url;
    const isLoginRequest = url.includes('/auth/login');
    const isRefreshRequest = url.includes('/auth/refresh');

    if (response.status === 401 && !isLoginRequest && !isRefreshRequest) {
      // If already refreshing, add to queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      isRefreshing = true;

      try {
        const refreshed = await directRefreshAuth();
        isRefreshing = false;

        if (refreshed) {
          // Retry the original request
          processQueue(null, 'refreshed');
          response = await fetch(input, {
            ...init,
            credentials: "include", // Always include credentials for auth
            headers: {
              ...(csrfToken && isStateChanging && { 'X-CSRF-Token': csrfToken }),
              ...init?.headers,
            },
          });
        } else {
          // Refresh failed, clear queue with error
          const error = new TokenRefreshError();
          processQueue(error, null);

          // Notify about auth failure
          if (this.onAuthError) {
            this.onAuthError();
          }

          // Also throw the error to ensure proper handling
          throw error;
        }
      } catch (error) {
        isRefreshing = false;
        processQueue(error, null);
        throw error;
      }
    }

    // If CSRF token is invalid, fetch a new one and retry
    if (response.status === 403) {
      const responseClone = response.clone();
      const responseText = await responseClone.text();

      if (responseText.includes('CSRF') || responseText.includes('csrf')) {
        console.log('🔄 CSRF token invalid, fetching new token and retrying...');
        await fetchCsrfToken();

        // Retry the request with new CSRF token
        response = await fetch(input, {
          ...init,
          credentials: "include",
          headers: {
            ...(csrfToken && isStateChanging && { 'X-CSRF-Token': csrfToken }),
            ...init?.headers,
          },
        });
      }
    }

    return response;
  }

  /**
   * GET request
   */
  async get(endpoint: string): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * POST request
   */
  async post(endpoint: string, data?: any): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint: string, data?: any): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint: string): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

// Create and export the api client instance
const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1");

export { apiClient };