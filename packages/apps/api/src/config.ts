// Import from monorepo centralized configuration
import { apiConfig, isDevelopment, isProduction, isStaging, isTest } from '../../../../config';

// Re-export API-specific configuration
export const config = apiConfig;
export const { server, database, auth, security, features, monitoring, performance, nodeEnv } = apiConfig;

// Environment helpers
export { isDevelopment, isProduction, isStaging, isTest };

// Legacy exports for backward compatibility
export const port = apiConfig.server.port;
export const mongodbUri = apiConfig.database.uri;
export const jwtSecret = apiConfig.auth.jwtSecret;
export const jwtRefreshSecret = apiConfig.auth.jwtRefreshSecret;