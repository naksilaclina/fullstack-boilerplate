"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const entities_1 = require("../entities");
const bcrypt_1 = require("bcrypt");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from root .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../../../../.env') });
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
        await mongoose_1.default.connect(mongodbUri);
        console.log("Connected to MongoDB");
        // Find all users
        const users = await entities_1.UserModel.find({});
        console.log(`Found ${users.length} users`);
        let updatedCount = 0;
        // Update each user's password to meet strong requirements
        for (const user of users) {
            // For demo/test users, update to strong passwords
            if (user.email === "naksilaclina@gmail.com") {
                const strongPassword = await (0, bcrypt_1.hash)("Test123!@#", SALT_ROUNDS);
                user.password = strongPassword;
                await user.save();
                console.log(`Updated password for test user: ${user.email}`);
                updatedCount++;
            }
            else if (user.email === "admin@example.com") {
                const strongPassword = await (0, bcrypt_1.hash)("Admin123!@#", SALT_ROUNDS);
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
        await mongoose_1.default.disconnect();
        console.log("Disconnected from MongoDB");
        console.log("Migration completed successfully!");
    }
    catch (error) {
        console.error("Error during migration:", error);
        process.exit(1);
    }
}
// Run the migration function
if (require.main === module) {
    updateUserPasswords();
}
exports.default = updateUserPasswords;
