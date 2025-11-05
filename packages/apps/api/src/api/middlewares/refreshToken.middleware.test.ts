import { validateRefreshToken } from './refreshToken.middleware';
import { verifyRefreshToken } from '~api/services/auth/jwt.utils';

// Mock the verifyRefreshToken function
jest.mock('~api/services/auth/jwt.utils', () => ({
  verifyRefreshToken: jest.fn(),
}));

// Mock request, response, and next function
const mockRequest = {
  cookies: {},
} as any;

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
} as any;

const mockNext = jest.fn();

describe('Refresh Token Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Refresh Token Validation', () => {
    it('should return 401 if no refresh token cookie is provided', async () => {
      const req = { ...mockRequest, cookies: {} };
      const res = { ...mockResponse };
      const next = jest.fn();

      await validateRefreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No refresh token provided.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if refresh token is invalid', async () => {
      const req = { ...mockRequest, cookies: { refreshToken: 'invalid-refresh-token' } };
      const res = { ...mockResponse };
      const next = jest.fn();

      // Mock verifyRefreshToken to return null for invalid token
      (verifyRefreshToken as jest.Mock).mockResolvedValue(null);

      await validateRefreshToken(req, res, next);

      expect(verifyRefreshToken).toHaveBeenCalledWith('invalid-refresh-token');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired refresh token.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if refresh token is valid', async () => {
      const req = { ...mockRequest, cookies: { refreshToken: 'valid-refresh-token' } };
      const res = { ...mockResponse };
      const next = jest.fn();

      // Mock verifyRefreshToken to return valid payload
      const mockPayload = { userId: '123', email: 'test@example.com', role: 'user', jti: 'refresh-jti' };
      (verifyRefreshToken as jest.Mock).mockResolvedValue(mockPayload);

      await validateRefreshToken(req, res, next);

      expect(verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(req.refreshToken).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle internal server errors', async () => {
      const req = { ...mockRequest, cookies: { refreshToken: 'error-refresh-token' } };
      const res = { ...mockResponse };
      const next = jest.fn();

      // Mock verifyRefreshToken to throw an error
      (verifyRefreshToken as jest.Mock).mockRejectedValue(new Error('Internal error'));

      await validateRefreshToken(req, res, next);

      expect(verifyRefreshToken).toHaveBeenCalledWith('error-refresh-token');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error during refresh token validation.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});