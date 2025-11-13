import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getProfile, refreshAuth } from '@/services/auth';
import type { User } from './types.ts';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;          // For active loading states (show spinners)
  backgroundValidating: boolean; // For background validation (don't show spinners)
  initializing: boolean;     // For initial app load auth check
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,          // Start with loading true during initial check
  backgroundValidating: false,
  initializing: true,     // Start with initializing true
  error: null,
};

// Async thunk to check auth status
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    console.log('🔄 checkAuthStatus: Starting auth check...');
    
    try {
      console.log('🔄 checkAuthStatus: Calling getProfile...');
      const profile = await getProfile();
      console.log('✅ checkAuthStatus: getProfile successful', profile);
      return profile;
    } catch (error: any) {
      console.log('❌ checkAuthStatus: getProfile failed', error);
      // Return a more specific error for unauthenticated users
      if (error.message === 'UNAUTHENTICATED') {
        return rejectWithValue('UNAUTHENTICATED');
      }
      return rejectWithValue(error.message || 'Failed to check auth status');
    }
  }
);

// Async thunk to refresh auth tokens
export const refreshAuthStatus = createAsyncThunk(
  'auth/refreshStatus',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 refreshAuthStatus: Calling refreshAuth...');
      const refreshed = await refreshAuth();
      console.log('✅ refreshAuthStatus: refreshAuth result', refreshed);
      if (refreshed) {
        // After successful refresh, get the profile
        console.log('🔄 refreshAuthStatus: Getting profile after refresh...');
        const profile = await getProfile();
        console.log('✅ refreshAuthStatus: getProfile after refresh successful', profile);
        return profile;
      } else {
        console.log('❌ refreshAuthStatus: refreshAuth returned false');
        return rejectWithValue('Failed to refresh authentication');
      }
    } catch (error: any) {
      console.log('❌ refreshAuthStatus: refreshAuth failed', error);
      return rejectWithValue(error.message || 'Failed to refresh authentication');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.initializing = false;        // Auth tamamlandı
      state.backgroundValidating = false; // Background validation bitti
      state.error = null;
      console.log('✅ setUser: User set in state', action.payload.user);
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.initializing = false;        // Auth tamamlandı
      state.backgroundValidating = false; // Background validation bitti
      state.error = null;
      console.log('✅ clearUser: User cleared from state');
    },

    // Logout action to clear user state
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.initializing = false;        // Auth tamamlandı
      state.backgroundValidating = false; // Background validation bitti
      state.error = null;
      console.log('✅ logout: User logged out');
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        // Only show loading spinner for initial auth check, not background validation
        if (state.initializing) {
          state.loading = true;
        } else {
          state.backgroundValidating = true;
        }
        state.error = null;
        console.log('🔄 checkAuthStatus: Pending');
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.user = {
          id: action.payload.id,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          email: action.payload.email,
          role: action.payload.role
        };
        state.isAuthenticated = true;
        state.loading = false;
        state.initializing = false;        // Auth tamamlandı
        state.backgroundValidating = false; // Background validation bitti
        state.error = null;
        console.log('✅ checkAuthStatus: Fulfilled', action.payload);
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.initializing = false;        // Auth tamamlandı (başarısız)
        state.backgroundValidating = false; // Background validation bitti
        // Don't set error for unauthenticated users as it's expected
        if (action.payload !== 'UNAUTHENTICATED') {
          state.error = action.payload as string || 'Failed to authenticate';
        }
        console.log('❌ checkAuthStatus: Rejected', action.payload);
      })
      
      // Refresh auth status
      .addCase(refreshAuthStatus.pending, (state) => {
        // Always treat token refresh as background operation
        state.backgroundValidating = true;
        state.error = null;
        console.log('🔄 refreshAuthStatus: Pending');
      })
      .addCase(refreshAuthStatus.fulfilled, (state, action) => {
        state.user = {
          id: action.payload.id,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          email: action.payload.email,
          role: action.payload.role
        };
        state.isAuthenticated = true;
        state.loading = false;
        state.initializing = false;        // Auth tamamlandı
        state.backgroundValidating = false; // Background validation bitti
        state.error = null;
        console.log('✅ refreshAuthStatus: Fulfilled', action.payload);
      })
      .addCase(refreshAuthStatus.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.initializing = false;        // Auth tamamlandı (başarısız)
        state.backgroundValidating = false; // Background validation bitti
        // Don't set error for token refresh failures as it's expected when tokens are expired
        if (action.payload !== 'Token refresh failed' && action.payload !== 'Failed to refresh authentication') {
          state.error = action.payload as string || 'Failed to refresh authentication';
        }
        console.log('❌ refreshAuthStatus: Rejected', action.payload);
      });
  },
});

export const { setUser, clearUser, logout } = authSlice.actions;

export type { AuthState };

export default authSlice.reducer;