import { hash } from "bcrypt";
import mongoose from "mongoose";
import { UserModel } from "../entities";
import { config, isDevelopment } from "../config";

// Use centralized configuration
const mongodbUri = config.database.uri;
const mongodbDevUri = config.database.devUri;

console.log("NODE_ENV:", config.nodeEnv);

const SALT_ROUNDS = 10;

async function seedUsers(maxRetries = 5, retryDelay = 2000) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Connect to MongoDB
      console.log("Connecting to MongoDB...");
      
      // In development, connect to the Memory Server using environment variable
      let connection;
      let uri;
      if (isDevelopment) {
        try {
          // Use the development MongoDB URI from environment variables
          uri = mongodbDevUri;
          if (!uri) {
            throw new Error("Development URI not available");
          }
          console.log("Using MongoDB Memory Server for seeding (from env):", uri);
          connection = await mongoose.connect(uri);
        } catch (error) {
          console.log("Failed to connect to MongoDB Memory Server, using provided URI:", mongodbUri);
          uri = mongodbUri;
          if (!uri) {
            throw new Error("MongoDB URI is required");
          }
          connection = await mongoose.connect(uri);
        }
      } else {
        // In production, use the provided URI
        uri = mongodbUri;
        if (!uri) {
          throw new Error("MongoDB URI is required");
        }
        connection = await mongoose.connect(uri);
      }
      
      console.log("Connected to MongoDB");

      // Check if users already exist
      const userCount = await UserModel.countDocuments();
      if (userCount > 0 && !config.features.forceSeed) {
        console.log(`Database already contains ${userCount} users. Skipping seeding.`);
        console.log("To force seeding, set FORCE_SEED=true environment variable.");
        await mongoose.disconnect();
        return;
      }

      // Clear existing users only if forced
      if (config.features.forceSeed) {
        console.log("Clearing existing users (forced)...");
        await UserModel.deleteMany({});
        console.log("Cleared existing users");
      }

      // Create test user
      console.log("Creating test user...");
      const testUserPassword = await hash("test123", SALT_ROUNDS);
      const testUser = new UserModel({
        firstName: "Anıl",
        lastName: "Çalışkan",
        email: "naksilaclina@gmail.com",
        password: testUserPassword,
        role: "user",
        isActive: true,
      });
      await testUser.save();
      console.log("Created test user:", testUser.email);

      // Create admin user
      console.log("Creating admin user...");
      const adminUserPassword = await hash("admin123", SALT_ROUNDS);
      const adminUser = new UserModel({
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: adminUserPassword,
        role: "admin",
        isActive: true,
      });
      await adminUser.save();
      console.log("Created admin user:", adminUser.email);

      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
      console.log("Seed completed successfully!");
      return; // Success, exit the retry loop
    } catch (error: unknown) {
      retries++;
      if (error instanceof Error) {
        console.error(`Error seeding users (attempt ${retries}/${maxRetries}):`, error.message);
      } else {
        console.error(`Error seeding users (attempt ${retries}/${maxRetries}):`, error);
      }
      
      if (retries < maxRetries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error("Max retries reached. Failed to seed database.");
        process.exit(1);
      }
    }
  }
}

// Run the seed function
if (require.main === module) {
  seedUsers();
}

export default seedUsers;