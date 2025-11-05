import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, invalidateRefreshToken } from './jwt.utils';
import { UserModel, SessionModel } from '@naksilaclina/mongodb';
import jwt from 'jsonwebtoken';

// Mock user document for testing
const mockUser = {
  _id: '1234567890',
  email: 'test@example.com',
  role: 'user',
  firstName: 'Test',
  lastName: 'User',
  password: 'hashedpassword',
  isActive: true,
} as any;

describe('JWT Utilities', () => {
  describe('signAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = signAccessToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      expect(decoded).toHaveProperty('userId', mockUser._id);
      expect(decoded).toHaveProperty('email', mockUser.email);
      expect(decoded).toHaveProperty('role', mockUser.role);
    });
  });

  describe('signRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = signRefreshToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
      expect(decoded).toHaveProperty('userId', mockUser._id);
      expect(decoded).toHaveProperty('email', mockUser.email);
      expect(decoded).toHaveProperty('role', mockUser.role);
      expect(decoded).toHaveProperty('jti');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = signAccessToken(mockUser);
      const decoded = verifyAccessToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded).toHaveProperty('userId', mockUser._id);
      expect(decoded).toHaveProperty('email', mockUser.email);
      expect(decoded).toHaveProperty('role', mockUser.role);
    });

    it('should return null for an invalid access token', () => {
      const decoded = verifyAccessToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', async () => {
      const token = signRefreshToken(mockUser);
      const decoded = await verifyRefreshToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded).toHaveProperty('userId', mockUser._id);
      expect(decoded).toHaveProperty('email', mockUser.email);
      expect(decoded).toHaveProperty('role', mockUser.role);
      expect(decoded).toHaveProperty('jti');
    });

    it('should return null for an invalid refresh token', async () => {
      const decoded = await verifyRefreshToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for an invalidated refresh token', async () => {
      const token = signRefreshToken(mockUser);
      const decoded = jwt.decode(token) as any;
      
      // Create a session in the database first
      const session = new SessionModel({
        userId: mockUser._id,
        refreshTokenId: decoded.jti,
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await session.save();
      
      // Invalidate the refresh token
      await invalidateRefreshToken(decoded.jti);
      
      const verified = await verifyRefreshToken(token);
      expect(verified).toBeNull();
    });
  });
});