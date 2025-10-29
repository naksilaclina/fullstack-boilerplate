import { authenticate } from './auth.middleware';
import { verifyAccessToken } from '~api/services/auth/jwt.utils';

// Mock the verifyAccessToken function
jest.mock('~api/services/auth/jwt.utils', () => ({
  verifyAccessToken: jest.fn(),
}));

// Mock request, response, and next function
const mockRequest = {
  headers: {},
} as any;

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
} as any;

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('should return 401 if no authorization header is provided', async () => {
      const req = { ...mockRequest, headers: {} };
      const res = { ...mockResponse };
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      const req = { ...mockRequest, headers: { authorization: 'Bearer invalid-token' } };
      const res = { ...mockResponse };
      const next = jest.fn();

      // Mock verifyAccessToken to return null for invalid token
      (verifyAccessToken as jest.Mock).mockReturnValue(null);

      await authenticate(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if token is valid', async () => {
      const req = { ...mockRequest, headers: { authorization: 'Bearer valid-token' } };
      const res = { ...mockResponse };
      const next = jest.fn();

      // Mock verifyAccessToken to return valid payload
      const mockPayload = { userId: '123', email: 'test@example.com', role: 'user' };
      (verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      await authenticate(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle internal server errors', async () => {
      const req = { ...mockRequest, headers: { authorization: 'Bearer error-token' } };
      const res = { ...mockResponse };
      const next = jest.fn();

      // Mock verifyAccessToken to throw an error
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Internal error');
      });

      await authenticate(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith('error-token');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error during authentication.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});