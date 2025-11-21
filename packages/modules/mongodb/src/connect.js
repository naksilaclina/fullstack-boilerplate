"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("./config");
mongoose_1.default.set("strictQuery", false);
async function connect(mongodbUri) {
    // In development, connect to the Memory Server using centralized configuration
    if (config_1.isDevelopment) {
        try {
            // Use the development MongoDB URI from centralized config
            const devUri = config_1.config.database.devUri || "mongodb://127.0.0.1:27018/naksilaclina-dev";
            console.log("Using MongoDB Memory Server (from config):", devUri);
            return await mongoose_1.default.connect(devUri);
        }
        catch (error) {
            console.log("Failed to connect to MongoDB Memory Server, using provided URI:", mongodbUri);
            return await mongoose_1.default.connect(mongodbUri);
        }
    }
    else {
        // In production, use the provided URI
        return await mongoose_1.default.connect(mongodbUri);
    }
}
exports.default = connect;
