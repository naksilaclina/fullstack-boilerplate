"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongooseOptions = exports.isTest = exports.isStaging = exports.isProduction = exports.isDevelopment = exports.nodeEnv = exports.monitoring = exports.features = exports.database = exports.config = void 0;
// Import from monorepo centralized configuration
const { mongoConfig, isDevelopment, isProduction, isStaging, isTest } = require('../../../../config/index');
exports.isDevelopment = isDevelopment;
exports.isProduction = isProduction;
exports.isStaging = isStaging;
exports.isTest = isTest;
// Re-export MongoDB-specific configuration
exports.config = mongoConfig;
exports.database = mongoConfig.database, exports.features = mongoConfig.features, exports.monitoring = mongoConfig.monitoring, exports.nodeEnv = mongoConfig.nodeEnv;
// MongoDB connection options
exports.mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: isProduction ? 10 : 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    bufferMaxEntries: 0,
    ...(exports.database.ssl.validate && {
        ssl: true,
        sslValidate: exports.database.ssl.validate,
        ...(exports.database.ssl.caCertPath && { sslCA: exports.database.ssl.caCertPath }),
    }),
};
