import mongoose from 'mongoose';
import { SessionModel, UserModel } from '@naksilaclina/mongodb/src/entities';

// Mock user document for testing
const mockUser = {
  email: 'test@example.com',
  role: 'user',
  firstName: 'Test',
  lastName: 'User',
  password: 'hashedpassword',
  isActive: true,
};

describe('Sessions Model Tests', () => {
  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('Session Creation and Retrieval', () => {
    it('should create and retrieve sessions', async () => {
      // Create a user
      const user = new UserModel(mockUser);
      await user.save();

      // Create sessions
      const session1 = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: 'refresh-token-1',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await session1.save();

      const session2 = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: 'refresh-token-2',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await session2.save();

      // Retrieve sessions
      const sessions = await SessionModel.find({ userId: user._id.toString() }).sort({ createdAt: -1 });
      
      expect(sessions).toHaveLength(2);
      expect(sessions[0].refreshTokenId).toBe('refresh-token-2');
      expect(sessions[1].refreshTokenId).toBe('refresh-token-1');
    });
  });

  describe('Session Deletion', () => {
    it('should delete a specific session', async () => {
      // Create a user
      const user = new UserModel(mockUser);
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

      // Delete the session
      await SessionModel.deleteOne({ _id: session._id, userId: user._id.toString() });

      // Check that session was deleted
      const deletedSession = await SessionModel.findById(session._id);
      expect(deletedSession).toBeNull();
    });
  });

  describe('Bulk Session Deletion', () => {
    it('should delete multiple sessions except the current one', async () => {
      // Create a user
      const user = new UserModel(mockUser);
      await user.save();

      // Create current session
      const currentSession = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: 'current-refresh-token',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await currentSession.save();

      // Create other sessions
      const session1 = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: 'refresh-token-1',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await session1.save();

      const session2 = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: 'refresh-token-2',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await session2.save();

      // Delete all sessions except the current one
      await SessionModel.deleteMany({ 
        userId: user._id.toString(),
        refreshTokenId: { $ne: 'current-refresh-token' }
      });

      // Check that only current session remains
      const remainingSessions = await SessionModel.find({ userId: user._id.toString() });
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].refreshTokenId).toBe('current-refresh-token');
    });
  });
});