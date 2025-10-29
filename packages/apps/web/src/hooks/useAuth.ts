import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setUser, clearUser } from '../store/authSlice';
import type { User } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: (user: User) => dispatch(setUser({ user })),
    logout: () => dispatch(clearUser()),
  };
};