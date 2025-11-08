/**
 * Server-side configuration
 * This file should only be imported in server-side code (API routes, middleware, etc.)
 */

// Import from monorepo centralized configuration (server-side only)
import { webConfig, isDevelopment, isProduction, isStaging, isTest } from '../../../../config';

// Re-export Web-specific configuration for server-side use
export const config = webConfig;
export const { server, api, auth, features, monitoring, build, nodeEnv } = webConfig;

// Environment helpers
export { isDevelopment, isProduction, isStaging, isTest };

// Server-side only exports
export const serverConfig = {
  ...webConfig,
  // Add any server-specific configuration here
};