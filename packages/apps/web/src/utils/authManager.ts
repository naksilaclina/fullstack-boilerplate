/**
 * Singleton auth manager to prevent multiple simultaneous auth checks
 */
class AuthManager {
  private static instance: AuthManager;
  private authCheckPromise: Promise<any> | null = null;
  private isChecking = false;
  private pendingCalls: { dispatch: any; checkAuthStatus: any; resolve: (value: any) => void; reject: (reason?: any) => void }[] = [];

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  public async checkAuth(dispatch: any, checkAuthStatus: any): Promise<any> {
    // If already checking, queue up this call
    if (this.isChecking && this.authCheckPromise) {
      console.log('🔄 AuthManager: Auth check already in progress, queuing call');
      return new Promise((resolve, reject) => {
        this.pendingCalls.push({ dispatch, checkAuthStatus, resolve, reject });
      });
    }

    // If not checking, start a new check
    console.log('🔄 AuthManager: Starting new auth check');
    this.isChecking = true;
    this.authCheckPromise = dispatch(checkAuthStatus());
    
    try {
      const result = await this.authCheckPromise;
      console.log('✅ AuthManager: Auth check successful', result);
      
      // Process pending calls
      this.processPendingCalls(null, result);
      
      return result;
    } catch (error) {
      console.log('❌ AuthManager: Auth check failed', error);
      
      // Process pending calls with error
      this.processPendingCalls(error, null);
      
      throw error;
    } finally {
      // Reset state after check completes
      console.log('🔄 AuthManager: Resetting auth check state');
      this.isChecking = false;
      this.authCheckPromise = null;
    }
  }

  private processPendingCalls(error: any, result: any) {
    console.log(`🔄 AuthManager: Processing ${this.pendingCalls.length} pending calls`);
    this.pendingCalls.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
    this.pendingCalls = [];
  }

  public reset(): void {
    console.log('🔄 AuthManager: Resetting all state');
    this.isChecking = false;
    this.authCheckPromise = null;
    this.pendingCalls = [];
  }
}

export const authManager = AuthManager.getInstance();