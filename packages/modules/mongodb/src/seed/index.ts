import { hash } from "bcrypt";
import mongoose from "mongoose";
import { UserModel } from "../entities";

// Simple configuration without validation for seeding
const isDevelopment = process.env.NODE_ENV === 'development';
const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/naksilaclina';
const mongodbDevUri = process.env.MONGODB_DEV_URI || 'mongodb://localhost:27017/naksilaclina-dev';

console.log("NODE_ENV:", process.env.NODE_ENV || 'development');

const SALT_ROUNDS = 10;

interface SeedOptions {
  force?: boolean;
  clear?: boolean;
}

async function seedUsers(options: SeedOptions = {}, maxRetries = 5, retryDelay = 2000) {
  let retries = 0;
  const { force = false, clear = false } = options;
  
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
          console.log("Using MongoDB Memory Server for seeding (from env):", uri);
          connection = await mongoose.connect(uri);
        } catch (error) {
          console.log("Failed to connect to MongoDB Memory Server, using provided URI:", mongodbUri);
          uri = mongodbUri;
          connection = await mongoose.connect(uri);
        }
      } else {
        // In production, use the provided URI
        uri = mongodbUri;
        connection = await mongoose.connect(uri);
      }
      
      console.log("Connected to MongoDB");

      // Check if users already exist
      const userCount = await UserModel.countDocuments();
      if (userCount > 0 && !force && !clear) {
        console.log(`Database already contains ${userCount} users. Skipping seeding.`);
        console.log("To force seeding, use --force flag.");
        await mongoose.disconnect();
        return;
      }

      // Clear existing users if requested
      if (clear || force) {
        console.log("Clearing existing users...");
        await UserModel.deleteMany({});
        console.log("Cleared existing users");
      }

      // Create test user with strong password
      console.log("Creating test user...");
      // Updated to use a strong password that meets our requirements
      const testUserPassword = await hash("Test123!@#", SALT_ROUNDS);
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

      // Create admin user with strong password
      console.log("Creating admin user...");
      // Updated to use a strong password that meets our requirements
      const adminUserPassword = await hash("Admin123!@#", SALT_ROUNDS);
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

// Parse command line arguments
function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--clear' || arg === '-c') {
      options.clear = true;
    }
  }
  
  return options;
}

// Run the seed function
if (require.main === module) {
  const options = parseArgs();
  seedUsers(options);
}

export default seedUsers;