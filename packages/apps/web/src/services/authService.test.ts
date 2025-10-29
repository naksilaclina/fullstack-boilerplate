// Mock the fetch API
global.fetch = jest.fn();

import { 
  login, 
  register, 
  logout, 
  refreshAccessToken, 
  getProfile, 
  getSessions, 
  revokeSession, 
  revokeAllSessions 
} from './authService';

describe('Auth Service', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: 'Login successful',
          user: {
            id: '123',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            role: 'user'
          },
          accessToken: 'mock-access-token'
        })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123' };
      const result = await login(credentials);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should handle login errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'Invalid credentials' }))
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'wrongpassword' };
      
      await expect(login(credentials)).rejects.toThrow('Invalid email or password. Please check your credentials and try again.');
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: 'Registration successful',
          user: {
            id: '123',
            firstName: 'New',
            lastName: 'User',
            email: 'newuser@example.com',
            role: 'user'
          },
          accessToken: 'mock-access-token'
        })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const userData = { 
        firstName: 'New', 
        lastName: 'User', 
        email: 'newuser@example.com', 
        password: 'password123' 
      };
      
      const result = await register(userData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should handle registration errors', async () => {
      const mockResponse = {
        ok: false,
        status: 409,
        json: jest.fn().mockResolvedValue({ error: 'User already exists' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const userData = { 
        firstName: 'Existing', 
        lastName: 'User', 
        email: 'existing@example.com', 
        password: 'password123' 
      };
      
      await expect(register(userData)).rejects.toThrow('An account with this email already exists. Please use a different email or login instead.');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ message: 'Logout successful' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await logout();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    });

    it('should handle logout errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Not logged in' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(logout()).rejects.toThrow('You are not logged in. Please login first.');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: 'Token refresh successful',
          accessToken: 'new-access-token'
        })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await refreshAccessToken();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should handle refresh token errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Session expired' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(refreshAccessToken()).rejects.toThrow('Session expired. Please login again.');
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const mockProfile = {
        id: '123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'user'
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockProfile)
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getProfile('mock-access-token');

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/v1/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-access-token',
        },
      });
      
      expect(result.email).toBe('test@example.com');
    });

    it('should handle profile errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Session expired' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(getProfile('mock-access-token')).rejects.toThrow('Your session has expired. Please login again.');
    });
  });

  describe('getSessions', () => {
    it('should get all user sessions', async () => {
      const mockSessions = [
        {
          id: 'session1',
          createdAt: '2023-01-01T00:00:00Z',
          userAgent: 'Mozilla/5.0',
          ipAddr: '127.0.0.1',
          expiresAt: '2023-01-08T00:00:00Z'
        }
      ];
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: 'Sessions retrieved successfully',
          sessions: mockSessions
        })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getSessions();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/v1/auth/sessions', {
        method: 'GET',
        credentials: 'include',
      });
      
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe('session1');
    });

    it('should handle session retrieval errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Not logged in' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(getSessions()).rejects.toThrow('You are not logged in. Please login first.');
    });
  });

  describe('revokeSession', () => {
    it('should revoke a specific session', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ message: 'Session revoked successfully' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await revokeSession('session123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/v1/auth/sessions/session123', {
        method: 'DELETE',
        credentials: 'include',
      });
    });

    it('should handle session revocation errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Session not found' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(revokeSession('nonexistent')).rejects.toThrow('Session not found.');
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all sessions except current', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ message: 'All sessions revoked successfully' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await revokeAllSessions();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/v1/auth/sessions', {
        method: 'DELETE',
        credentials: 'include',
      });
    });

    it('should handle bulk session revocation errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Not logged in' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(revokeAllSessions()).rejects.toThrow('You are not logged in. Please login first.');
    });
  });
});