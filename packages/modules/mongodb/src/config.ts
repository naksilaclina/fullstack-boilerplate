// Import from monorepo centralized configuration
const { mongoConfig, isDevelopment, isProduction, isStaging, isTest } = require('../../../../config/index');

// Re-export MongoDB-specific configuration
export const config = mongoConfig;
export const { database, features, monitoring, nodeEnv } = mongoConfig;

// Environment helpers
export { isDevelopment, isProduction, isStaging, isTest };

// MongoDB connection options
export const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: isProduction ? 10 : 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0,
  ...(database.ssl.validate && {
    ssl: true,
    sslValidate: database.ssl.validate,
    ...(database.ssl.caCertPath && { sslCA: database.ssl.caCertPath }),
  }),
};