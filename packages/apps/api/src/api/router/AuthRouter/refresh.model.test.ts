import mongoose from 'mongoose';
import { SessionModel, UserModel } from '@naksilaclina/mongodb/src/entities';

describe('Refresh Token Model Tests', () => {
  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('Session Refresh', () => {
    it('should create new session during token refresh', async () => {
      // Create a user
      const user = new UserModel({
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
        isActive: true,
      });
      await user.save();

      // Create old session
      const oldSession = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: 'old-refresh-token',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await oldSession.save();

      // Delete old session (simulating refresh process)
      await SessionModel.deleteOne({ refreshTokenId: 'old-refresh-token' });

      // Create new session (simulating refresh process)
      const newSession = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: 'new-refresh-token',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await newSession.save();

      // Check that old session was deleted
      const deletedSession = await SessionModel.findOne({ refreshTokenId: 'old-refresh-token' });
      expect(deletedSession).toBeNull();

      // Check that new session was created
      const createdSession = await SessionModel.findOne({ refreshTokenId: 'new-refresh-token' });
      expect(createdSession).not.toBeNull();
      expect(createdSession?.userId).toBe(user._id.toString());
    });
  });
});