/**
 * Singleton auth manager to prevent multiple simultaneous auth checks
 */
class AuthManager {
  private static instance: AuthManager;
  private authCheckPromise: Promise<any> | null = null;
  private isChecking = false;

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  public async checkAuth(dispatch: any, checkAuthStatus: any): Promise<any> {
    // If already checking, return the existing promise
    if (this.authCheckPromise) {
      return this.authCheckPromise;
    }

    // If not checking, start a new check
    if (!this.isChecking) {
      this.isChecking = true;
      this.authCheckPromise = dispatch(checkAuthStatus());
      
      try {
        const result = await this.authCheckPromise;
        return result;
      } finally {
        // Reset state after check completes
        this.isChecking = false;
        this.authCheckPromise = null;
      }
    }

    return null;
  }

  public reset(): void {
    this.isChecking = false;
    this.authCheckPromise = null;
  }
}

export const authManager = AuthManager.getInstance();