// Track if we're currently refreshing token to prevent multiple simultaneous refreshes
let isRefreshing = false;
// Track requests that need to be retried after token refresh
let failedQueue: { resolve: (value: any) => void; reject: (reason?: any) => void }[] = [];

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
    
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
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
 * Create an API client with automatic token refresh
 */
class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Make a fetch request with automatic token refresh
   */
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    // Make the initial request
    let response = await fetch(input, {
      ...init,
      credentials: "include", // Always include credentials for auth
    });
    
    // If unauthorized, try to refresh token
    if (response.status === 401) {
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
          });
        } else {
          // Refresh failed, clear queue with error
          processQueue(new Error('Token refresh failed'), null);
          // Also throw the error to ensure proper handling
          throw new Error('Token refresh failed');
        }
      } catch (error) {
        isRefreshing = false;
        processQueue(error, null);
        throw error;
      }
    }
    
    return response;
  }
  
  /**
   * GET request
   */
  async get(url: string, options?: RequestInit): Promise<Response> {
    return this.fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: "GET",
    });
  }
  
  /**
   * POST request
   */
  async post(url: string, body?: any, options?: RequestInit): Promise<Response> {
    return this.fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  
  /**
   * PUT request
   */
  async put(url: string, body?: any, options?: RequestInit): Promise<Response> {
    return this.fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  
  /**
   * DELETE request
   */
  async delete(url: string, options?: RequestInit): Promise<Response> {
    return this.fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: "DELETE",
    });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1");

export default ApiClient;