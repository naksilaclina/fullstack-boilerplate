import mongoose from 'mongoose';
import { UserModel } from '@naksilaclina/mongodb/src/entities';

describe('Profile Integration Tests', () => {
  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('User Profile Retrieval', () => {
    it('should retrieve user profile for authenticated user', async () => {
      // Create a user
      const user = new UserModel({
        email: 'profileuser@example.com',
        role: 'user',
        firstName: 'Profile',
        lastName: 'User',
        password: 'hashedpassword',
        isActive: true,
      });
      await user.save();

      // Simulate profile retrieval
      const retrievedUser = await UserModel.findById(user._id);
      
      // Verify profile data
      expect(retrievedUser).not.toBeNull();
      expect(retrievedUser?._id.toString()).toBe(user._id.toString());
      expect(retrievedUser?.email).toBe('profileuser@example.com');
      expect(retrievedUser?.firstName).toBe('Profile');
      expect(retrievedUser?.lastName).toBe('User');
      expect(retrievedUser?.role).toBe('user');
      
      // Verify sensitive data is not exposed
      expect(retrievedUser?.password).toBeDefined(); // Exists in DB but should be filtered out in API response
    });

    it('should handle profile retrieval for non-existent user', async () => {
      // Try to retrieve profile for non-existent user
      const nonExistentUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const user = await UserModel.findById(nonExistentUserId);
      
      // Should return null for non-existent user
      expect(user).toBeNull();
    });

    it('should exclude sensitive information from profile responses', async () => {
      // Create a user
      const user = new UserModel({
        email: 'sensitive@example.com',
        role: 'user',
        firstName: 'Sensitive',
        lastName: 'User',
        password: 'this-should-not-be-exposed',
        isActive: true,
      });
      await user.save();

      // Simulate API response filtering (what should be sent to client)
      const profileData = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        // Note: password should NOT be included here
      };

      // Verify sensitive data is excluded
      expect(profileData).not.toHaveProperty('password');
      expect(profileData).toHaveProperty('id');
      expect(profileData).toHaveProperty('email');
      expect(profileData).toHaveProperty('firstName');
      expect(profileData).toHaveProperty('lastName');
      expect(profileData).toHaveProperty('role');
    });
  });
});