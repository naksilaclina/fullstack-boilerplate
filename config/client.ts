/**
 * Client-safe configuration
 * This file can be safely imported in browser environments
 */

export interface ClientConfig {
  nodeEnv: 'development' | 'staging' | 'production' | 'test';
  api: {
    baseUrl: string;
  };
  auth: {
    nextAuthUrl?: string;
  };
  features: {
    enableDebugRoutes: boolean;
    enableHotReload: boolean;
    enableMockServices: boolean;
  };
  monitoring: {
    sentryDsn?: string;
  };
  build: {
    analyze: boolean;
    webpackAnalyzer: boolean;
  };
}

/**
 * Get client-safe configuration from environment variables
 * This function should only be called on the server side
 */
export function getClientConfig(): ClientConfig {
  // Only access process.env on server side
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    throw new Error('getClientConfig() should only be called on the server side');
  }

  const nodeEnv = (process.env.NODE_ENV || 'development') as ClientConfig['nodeEnv'];
  const apiHost = process.env.API_HOST || 'localhost';
  const apiPort = process.env.API_PORT || '5000';
  
  const apiBaseUrl = nodeEnv === 'development' 
    ? `http://${apiHost}:${apiPort}/api/v1`
    : `https://${apiHost}/api/v1`;

  return {
    nodeEnv,
    api: {
      baseUrl: apiBaseUrl,
    },
    auth: {
      nextAuthUrl: process.env.NEXTAUTH_URL,
    },
    features: {
      enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === 'true',
      enableHotReload: process.env.ENABLE_HOT_RELOAD === 'true',
      enableMockServices: process.env.ENABLE_MOCK_SERVICES === 'true',
    },
    monitoring: {
      sentryDsn: process.env.SENTRY_DSN,
    },
    build: {
      analyze: process.env.BUILD_ANALYZE === 'true',
      webpackAnalyzer: process.env.WEBPACK_BUNDLE_ANALYZER === 'true',
    },
  };
}

/**
 * Default client configuration for browser environments
 * These values will be replaced by Next.js at build time
 */
export const defaultClientConfig: ClientConfig = {
  nodeEnv: (process.env.NODE_ENV || 'development') as ClientConfig['nodeEnv'],
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
  },
  auth: {
    nextAuthUrl: process.env.NEXT_PUBLIC_AUTH_URL,
  },
  features: {
    enableDebugRoutes: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
    enableHotReload: process.env.NODE_ENV === 'development',
    enableMockServices: process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true',
  },
  monitoring: {
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  build: {
    analyze: false,
    webpackAnalyzer: false,
  },
};