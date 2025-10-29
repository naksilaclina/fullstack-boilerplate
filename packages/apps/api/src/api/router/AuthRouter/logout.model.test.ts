import mongoose from 'mongoose';
import { SessionModel, UserModel } from '@naksilaclina/mongodb/src/entities';

describe('Logout Model Tests', () => {
  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('Session Deletion on Logout', () => {
    it('should delete session when logging out', async () => {
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

      // Create a session
      const session = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: 'refresh-token-1',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await session.save();

      // Delete the session (simulating logout)
      await SessionModel.deleteOne({ refreshTokenId: 'refresh-token-1' });

      // Check that session was deleted
      const deletedSession = await SessionModel.findOne({ refreshTokenId: 'refresh-token-1' });
      expect(deletedSession).toBeNull();
    });
  });
});