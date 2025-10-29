import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setUser, clearUser } from '../store/authSlice';
import type { User } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  return {
    user,
    isAuthenticated,
    login: (user: Omit<User, 'email'>) => dispatch(setUser({ user })),
    logout: () => dispatch(clearUser()),
  };
};