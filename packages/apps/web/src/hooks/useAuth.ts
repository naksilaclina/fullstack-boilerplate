import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { login, logout, setAccessToken } from '../store/authSlice';
import type { User } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, accessToken } = useSelector((state: RootState) => state.auth);

  return {
    user,
    isAuthenticated,
    accessToken,
    login: (user: User, accessToken: string) => dispatch(login({ user, accessToken })),
    logout: () => dispatch(logout()),
    setAccessToken: (token: string) => dispatch(setAccessToken(token)),
  };
};