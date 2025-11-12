import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { setUser, logout } from '../../store/authSlice';
import type { User } from '../../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading, backgroundValidating, initializing, error } = useSelector((state: RootState) => state.auth);

  return {
    user,
    isAuthenticated,
    loading,
    backgroundValidating,
    initializing,
    error,
    // Computed states for better UX
    isLoading: loading || initializing, // True when we should show loading UI
    isValidating: backgroundValidating, // True when background validation is happening
    isReady: !loading && !initializing, // True when auth state is ready to use
    login: (user: User) => dispatch(setUser({ user })),
    logout: () => dispatch(logout()),
  };
};