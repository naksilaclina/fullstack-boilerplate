import { store } from '../store';
import { login, logout, setAccessToken } from '../store/authSlice';
import { User } from '../store/authSlice';

describe('authSlice', () => {
  it('should handle login', () => {
    const user: User = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'user'
    };
    const accessToken = 'test-token';
    
    store.dispatch(login({ user, accessToken }));
    
    const state = store.getState().auth;
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe(accessToken);
  });

  it('should handle logout', () => {
    store.dispatch(logout());
    
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it('should handle setAccessToken', () => {
    const newToken = 'new-token';
    store.dispatch(setAccessToken(newToken));
    
    const state = store.getState().auth;
    expect(state.accessToken).toBe(newToken);
  });
});