import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getProfile } from '@/services/auth';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  initializing: boolean;        // Uygulama başlarken true
  backgroundValidating: boolean; // Background validation için
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  initializing: true,           // Uygulama başlarken true
  backgroundValidating: false,  // Background validation için
  error: null
};

// Async thunk to check auth status with backend
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue, getState }) => {
    const state = getState() as { auth: AuthState };
    
    // Prevent duplicate calls if already loading or validating
    if (state.auth.loading || state.auth.backgroundValidating) {
      return rejectWithValue('Auth check already in progress');
    }
    
    try {
      const profile = await getProfile();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check auth status');
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
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.initializing = false;        // Auth tamamlandı
      state.backgroundValidating = false; // Background validation bitti
      state.error = null;
    },

    // Logout action to clear user state
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.initializing = false;        // Auth tamamlandı
      state.backgroundValidating = false; // Background validation bitti
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        // İlk yükleme mi yoksa background validation mı?
        if (state.initializing) {
          state.loading = true;
        } else {
          state.backgroundValidating = true;
        }
        state.error = null;
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
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.initializing = false;        // Auth tamamlandı (başarısız)
        state.backgroundValidating = false; // Background validation bitti
        state.error = action.payload as string || 'Failed to check auth status';
      });
  },
});

export const { setUser, clearUser, logout } = authSlice.actions;

export type { AuthState };

export default authSlice.reducer;