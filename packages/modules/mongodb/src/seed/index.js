"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = require("bcrypt");
const mongoose_1 = __importDefault(require("mongoose"));
const entities_1 = require("../entities");
// Simple configuration without validation for seeding
const isDevelopment = process.env.NODE_ENV === 'development';
const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/naksilaclina';
const mongodbDevUri = process.env.MONGODB_DEV_URI || 'mongodb://localhost:27017/naksilaclina-dev';
console.log("NODE_ENV:", process.env.NODE_ENV || 'development');
const SALT_ROUNDS = 10;
async function seedUsers(options = {}, maxRetries = 5, retryDelay = 2000) {
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
                    connection = await mongoose_1.default.connect(uri);
                }
                catch (error) {
                    console.log("Failed to connect to MongoDB Memory Server, using provided URI:", mongodbUri);
                    uri = mongodbUri;
                    connection = await mongoose_1.default.connect(uri);
                }
            }
            else {
                // In production, use the provided URI
                uri = mongodbUri;
                connection = await mongoose_1.default.connect(uri);
            }
            console.log("Connected to MongoDB");
            // Check if users already exist
            const userCount = await entities_1.UserModel.countDocuments();
            if (userCount > 0 && !force && !clear) {
                console.log(`Database already contains ${userCount} users. Skipping seeding.`);
                console.log("To force seeding, use --force flag.");
                await mongoose_1.default.disconnect();
                return;
            }
            // Clear existing users if requested
            if (clear || force) {
                console.log("Clearing existing users...");
                await entities_1.UserModel.deleteMany({});
                console.log("Cleared existing users");
            }
            // Create test user with strong password
            console.log("Creating test user...");
            // Updated to use a strong password that meets our requirements
            const testUserPassword = await (0, bcrypt_1.hash)("Test123!@#", SALT_ROUNDS);
            const testUser = new entities_1.UserModel({
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: testUserPassword,
                role: "user",
                isActive: true,
                // Adding new fields
                bio: "This is a test user for development purposes",
                phone: "+1234567890",
                dateOfBirth: new Date("1990-01-01"),
                gender: "prefer-not-to-say",
                address: {
                    street: "123 Main St",
                    city: "New York",
                    state: "NY",
                    zipCode: "10001",
                    country: "USA"
                },
                preferences: {
                    newsletter: true,
                    notifications: {
                        email: true,
                        push: false
                    },
                    theme: "auto",
                    language: "en"
                },
                timezone: "America/New_York",
                locale: "en-US",
                emailVerified: true
            });
            await testUser.save();
            console.log("Created test user:", testUser.email);
            // Create admin user with strong password
            console.log("Creating admin user...");
            // Updated to use a strong password that meets our requirements
            const adminUserPassword = await (0, bcrypt_1.hash)("Admin123!@#", SALT_ROUNDS);
            const adminUser = new entities_1.UserModel({
                firstName: "Admin",
                lastName: "User",
                email: "admin@example.com",
                password: adminUserPassword,
                role: "admin",
                isActive: true,
                // Adding new fields
                bio: "System administrator with full access rights",
                phone: "+1987654321",
                dateOfBirth: new Date("1985-05-15"),
                gender: "other",
                address: {
                    street: "456 Admin Ave",
                    city: "San Francisco",
                    state: "CA",
                    zipCode: "94102",
                    country: "USA"
                },
                preferences: {
                    newsletter: false,
                    notifications: {
                        email: true,
                        push: true
                    },
                    theme: "dark",
                    language: "en"
                },
                timezone: "America/Los_Angeles",
                locale: "en-US",
                emailVerified: true
            });
            await adminUser.save();
            console.log("Created admin user:", adminUser.email);
            // Disconnect from MongoDB
            await mongoose_1.default.disconnect();
            console.log("Disconnected from MongoDB");
            console.log("Seed completed successfully!");
            return; // Success, exit the retry loop
        }
        catch (error) {
            retries++;
            if (error instanceof Error) {
                console.error(`Error seeding users (attempt ${retries}/${maxRetries}):`, error.message);
            }
            else {
                console.error(`Error seeding users (attempt ${retries}/${maxRetries}):`, error);
            }
            if (retries < maxRetries) {
                console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
            else {
                console.error("Max retries reached. Failed to seed database.");
                process.exit(1);
            }
        }
    }
}
// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--force' || arg === '-f') {
            options.force = true;
        }
        else if (arg === '--clear' || arg === '-c') {
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
exports.default = seedUsers;
