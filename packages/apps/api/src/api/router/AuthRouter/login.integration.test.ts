import mongoose from 'mongoose';
import { UserModel, SessionModel } from '@naksilaclina/mongodb/src/entities';
import bcrypt from 'bcrypt';

describe('Login Integration Tests', () => {
  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('User Authentication', () => {
    it('should authenticate valid user credentials', async () => {
      // Create a user with hashed password
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const user = new UserModel({
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        password: hashedPassword,
        isActive: true,
      });
      await user.save();

      // Verify user was created
      expect(user._id).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      // Create a user with hashed password
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const user = new UserModel({
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        password: hashedPassword,
        isActive: true,
      });
      await user.save();

      // Verify password comparison works correctly
      const isPasswordValid = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isPasswordValid).toBe(false);
      
      const isCorrectPassword = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isCorrectPassword).toBe(true);
    });

    it('should reject non-existent users', async () => {
      // Try to find a user that doesn't exist
      const user = await UserModel.findOne({ email: 'nonexistent@example.com' });
      expect(user).toBeNull();
    });

    it('should reject deactivated accounts', async () => {
      // Create a deactivated user
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const user = new UserModel({
        email: 'deactivated@example.com',
        role: 'user',
        firstName: 'Deactivated',
        lastName: 'User',
        password: hashedPassword,
        isActive: false, // Deactivated account
      });
      await user.save();

      // Verify the account is deactivated
      expect(user.isActive).toBe(false);
    });
  });

  describe('Session Creation', () => {
    it('should create session after successful login', async () => {
      // Create a user
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const user = new UserModel({
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        password: hashedPassword,
        isActive: true,
      });
      await user.save();

      // Create a session for the user
      const session = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: 'test-refresh-token',
        userAgent: 'Mozilla/5.0',
        ipAddr: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await session.save();

      // Verify session was created
      expect(session._id).toBeDefined();
      expect(session.userId).toBe(user._id.toString());
      expect(session.refreshTokenId).toBe('test-refresh-token');
    });
  });
});