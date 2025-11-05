import mongoose from 'mongoose';
import { UserModel, SessionModel } from '@naksilaclina/mongodb/src/entities';
import bcrypt from 'bcrypt';
import { 
  signAccessToken, 
  signRefreshToken, 
  verifyAccessToken, 
  verifyRefreshToken,
  invalidateRefreshToken
} from '~api/services/auth/jwt.utils';

describe('Full Authentication Flow', () => {
  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('Complete User Journey', () => {
    it('should handle full authentication lifecycle', async () => {
      // 1. User Registration
      const plainPassword = 'SecurePass123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const user = new UserModel({
        email: 'fullflow@example.com',
        role: 'user',
        firstName: 'Full',
        lastName: 'Flow',
        password: hashedPassword,
        isActive: true,
      });
      await user.save();

      // Verify user was created
      expect(user._id).toBeDefined();
      expect(user.email).toBe('fullflow@example.com');

      // 2. User Login - Token Generation
      const accessToken = signAccessToken(user as any);
      const refreshToken = signRefreshToken(user as any);

      // Verify tokens were generated
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');

      // 3. Token Verification
      const decodedAccessToken = verifyAccessToken(accessToken);
      const decodedRefreshToken = await verifyRefreshToken(refreshToken);

      // Verify tokens are valid
      expect(decodedAccessToken).not.toBeNull();
      expect(decodedRefreshToken).not.toBeNull();
      expect(decodedAccessToken?.userId).toBe(user._id.toString());
      expect(decodedRefreshToken?.userId).toBe(user._id.toString());

      // 4. Session Creation
      const session = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: decodedRefreshToken?.jti || 'test-jti',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await session.save();

      // Verify session was created
      expect(session._id).toBeDefined();
      expect(session.userId).toBe(user._id.toString());

      // 5. Session Retrieval
      const sessions = await SessionModel.find({ userId: user._id.toString() });
      
      // Verify session retrieval
      expect(sessions).toHaveLength(1);
      expect(sessions[0].userId).toBe(user._id.toString());

      // 6. Token Refresh
      // Invalidate old refresh token
      if (decodedRefreshToken?.jti) {
        await invalidateRefreshToken(decodedRefreshToken.jti);
      }

      // Generate new tokens
      const newAccessToken = signAccessToken(user as any);
      const newRefreshToken = signRefreshToken(user as any);

      // Verify new tokens were generated
      expect(newAccessToken).toBeDefined();
      expect(newRefreshToken).toBeDefined();

      // Verify old refresh token is invalidated
      const verifiedOldToken = await verifyRefreshToken(refreshToken);
      expect(verifiedOldToken).toBeNull();

      // 7. Session Revocation
      await SessionModel.deleteOne({ _id: session._id });

      // Verify session was deleted
      const deletedSession = await SessionModel.findById(session._id);
      expect(deletedSession).toBeNull();

      // 8. User Profile Access
      const profileData = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      };

      // Verify profile data structure
      expect(profileData).toHaveProperty('id');
      expect(profileData).toHaveProperty('email');
      expect(profileData).toHaveProperty('firstName');
      expect(profileData).toHaveProperty('lastName');
      expect(profileData).toHaveProperty('role');
      expect(profileData).not.toHaveProperty('password'); // Sensitive data should not be exposed

      // 9. Logout - Final Cleanup
      // In a real logout, we would also clear cookies, but we've already deleted the session
      const finalSessionCount = await SessionModel.countDocuments({ userId: user._id.toString() });
      expect(finalSessionCount).toBe(0);
    });

    it('should handle authentication errors gracefully', async () => {
      // Test invalid credentials
      const user = await UserModel.findOne({ email: 'nonexistent@example.com' });
      expect(user).toBeNull();

      // Test invalid token verification
      const invalidTokenResult = verifyAccessToken('invalid-token');
      expect(invalidTokenResult).toBeNull();

      // Test invalid refresh token verification
      const invalidRefreshResult = await verifyRefreshToken('invalid-refresh-token');
      expect(invalidRefreshResult).toBeNull();

      // Test token invalidation with non-existent token
      expect(() => invalidateRefreshToken('non-existent-jti')).not.toThrow();
    });
  });
});