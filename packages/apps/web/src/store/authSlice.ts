import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthState {
  user: Omit<User, 'email'> | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: Omit<User, 'email'> | null }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = !!action.payload.user;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    // Initialize auth state (no longer uses localStorage)
    initAuthState: (state) => {
      // Auth state will be initialized by checking with the backend
      // This is a no-op now since we're using cookies
    }
  },
});

export const { setUser, clearUser, initAuthState } = authSlice.actions;

export type { AuthState };

export default authSlice.reducer;