import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getProfile, refreshAuth } from '@/services/auth';
import type { User } from './types';

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

// Async thunk to refresh auth status (silent background check)
export const refreshAuthStatus = createAsyncThunk(
  'auth/refreshStatus',
  async (_, { rejectWithValue }) => {
    console.log('🔄 refreshAuthStatus: Starting background auth refresh...');

    try {
      // First try to refresh the tokens
      const refreshResult = await refreshAuth();
      console.log('🔄 refreshAuthStatus: Refresh result', refreshResult);

      if (refreshResult) {
        // If refresh was successful, get the profile
        console.log('🔄 refreshAuthStatus: Getting profile after successful refresh...');
        const profile = await getProfile();
        console.log('✅ refreshAuthStatus: getProfile after refresh successful', profile);
        return profile;
      } else {
        console.log('❌ refreshAuthStatus: Token refresh failed');
        return rejectWithValue('UNAUTHENTICATED');
      }
    } catch (error: any) {
      console.log('❌ refreshAuthStatus: Refresh failed', error);
      // Return a more specific error for unauthenticated users
      if (error.message === 'UNAUTHENTICATED') {
        return rejectWithValue('UNAUTHENTICATED');
      }
      return rejectWithValue(error.message || 'Failed to refresh auth status');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set user action (used during login)
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = {
        id: action.payload.user.id,
        firstName: action.payload.user.firstName,
        lastName: action.payload.user.lastName,
        email: action.payload.user.email,
        role: action.payload.user.role
      };
      state.isAuthenticated = true;
      state.loading = false;
      state.initializing = false;        // Auth tamamlandı
      state.backgroundValidating = false; // Background validation bitti
      state.error = null;
      console.log('✅ setUser: User authenticated', action.payload.user);
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
        console.log('✅ checkAuthStatus: fulfilled', action.payload);
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        // For unauthenticated users, clear state but don't show error
        if (action.payload === 'UNAUTHENTICATED') {
          state.user = null;
          state.isAuthenticated = false;
          state.loading = false;
          state.initializing = false;        // Auth tamamlandı
          state.backgroundValidating = false; // Background validation bitti
          state.error = null;
          console.log('ℹ️ checkAuthStatus: User is unauthenticated (expected)');
        } else {
          // For other errors, show error state
          state.user = null;
          state.isAuthenticated = false;
          state.loading = false;
          state.initializing = false;        // Auth tamamlandı
          state.backgroundValidating = false; // Background validation bitti
          state.error = action.payload as string;
          console.log('❌ checkAuthStatus: rejected', action.payload);
        }
      })
      // Refresh auth status
      .addCase(refreshAuthStatus.pending, (state) => {
        // Don't show loading spinner for background refresh
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
        state.backgroundValidating = false;
        state.error = null;
        console.log('✅ refreshAuthStatus: fulfilled', action.payload);
      })
      .addCase(refreshAuthStatus.rejected, (state, action) => {
        // For unauthenticated users during refresh, clear state but don't show error
        if (action.payload === 'UNAUTHENTICATED') {
          state.user = null;
          state.isAuthenticated = false;
          state.backgroundValidating = false;
          state.error = null;
          console.log('ℹ️ refreshAuthStatus: User is unauthenticated (expected)');
        } else {
          // For other errors, show error state
          state.user = null;
          state.isAuthenticated = false;
          state.backgroundValidating = false;
          state.error = action.payload as string;
          console.log('❌ refreshAuthStatus: rejected', action.payload);
        }
      });
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;