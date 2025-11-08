// Import client-safe configuration
import { defaultClientConfig, type ClientConfig } from '../../../../config/client';

// Client-safe configuration for browser environments
export const config: ClientConfig = defaultClientConfig;

// Destructure for convenience
export const { nodeEnv, api, auth, features, monitoring, build } = config;

// Environment helpers
export const isDevelopment = nodeEnv === 'development';
export const isProduction = nodeEnv === 'production';
export const isStaging = nodeEnv === 'staging';
export const isTest = nodeEnv === 'test';

// Next.js specific exports
export const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: config.api.baseUrl,
  },
  experimental: {
    optimizeCss: config.nodeEnv === 'production',
  },
  compress: config.nodeEnv === 'production',
  poweredByHeader: false, // Security: hide X-Powered-By header
  generateEtags: config.nodeEnv === 'production',
};