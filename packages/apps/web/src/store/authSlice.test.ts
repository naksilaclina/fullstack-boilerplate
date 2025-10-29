import authReducer, { login, logout, setAccessToken, type AuthState } from './authSlice';

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    accessToken: null,
  };

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle login', () => {
    const user = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'user'
    };
    const accessToken = 'test-token';
    
    const actual = authReducer(initialState, login({ user, accessToken }));
    
    expect(actual.user).toEqual(user);
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.accessToken).toBe(accessToken);
  });

  it('should handle logout', () => {
    const loggedInState: AuthState = {
      user: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'user'
      },
      isAuthenticated: true,
      accessToken: 'test-token',
    };
    
    const actual = authReducer(loggedInState, logout());
    
    expect(actual.user).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
    expect(actual.accessToken).toBeNull();
  });

  it('should handle setAccessToken', () => {
    const newToken = 'new-token';
    const actual = authReducer(initialState, setAccessToken(newToken));
    
    expect(actual.accessToken).toBe(newToken);
  });

  it('should maintain state integrity during multiple operations', () => {
    // Start with initial state
    let state = authReducer(initialState, { type: 'unknown' });
    
    // Login
    const user = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'user'
    };
    const accessToken = 'test-token';
    state = authReducer(state, login({ user, accessToken }));
    
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe(accessToken);
    
    // Update access token
    const newToken = 'new-token';
    state = authReducer(state, setAccessToken(newToken));
    
    expect(state.user).toEqual(user); // User should remain the same
    expect(state.isAuthenticated).toBe(true); // Auth status should remain true
    expect(state.accessToken).toBe(newToken); // Token should be updated
    
    // Logout
    state = authReducer(state, logout());
    
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });
});