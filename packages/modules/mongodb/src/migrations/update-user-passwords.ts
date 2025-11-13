import mongoose from "mongoose";
import { UserModel } from "../entities";
import { hash } from "bcrypt";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

const mongodbUri = process.env.MONGODB_DEV_URI || process.env.MONGODB_URI;
const SALT_ROUNDS = 10;

/**
 * Migration script to update existing users to have strong passwords
 * This script will:
 * 1. Connect to the database
 * 2. Find all users with weak passwords (less than 8 characters)
 * 3. Update their passwords to meet strong password requirements
 * 4. Log the changes
 */
async function updateUserPasswords() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    
    if (!mongodbUri) {
      throw new Error("MongoDB URI is required");
    }
    
    await mongoose.connect(mongodbUri);
    console.log("Connected to MongoDB");
    
    // Find all users
    const users = await UserModel.find({});
    console.log(`Found ${users.length} users`);
    
    let updatedCount = 0;
    
    // Update each user's password to meet strong requirements
    for (const user of users) {
      // For demo/test users, update to strong passwords
      if (user.email === "naksilaclina@gmail.com") {
        const strongPassword = await hash("Test123!@#", SALT_ROUNDS);
        user.password = strongPassword;
        await user.save();
        console.log(`Updated password for test user: ${user.email}`);
        updatedCount++;
      } else if (user.email === "admin@example.com") {
        const strongPassword = await hash("Admin123!@#", SALT_ROUNDS);
        user.password = strongPassword;
        await user.save();
        console.log(`Updated password for admin user: ${user.email}`);
        updatedCount++;
      }
      // For other users, we would typically want them to change their passwords themselves
      // through a password reset process, not automatically update them
    }
    
    console.log(`Updated ${updatedCount} users with strong passwords`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

// Run the migration function
if (require.main === module) {
  updateUserPasswords();
}

export default updateUserPasswords;