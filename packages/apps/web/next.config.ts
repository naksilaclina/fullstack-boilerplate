import type { NextConfig } from "next";
import { getClientConfig } from "../../../config/client";

// Get server-side configuration
const serverConfig = getClientConfig();

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // Environment variables to expose to the client
  env: {
    NEXT_PUBLIC_API_BASE_URL: serverConfig.api.baseUrl,
    NEXT_PUBLIC_NODE_ENV: serverConfig.nodeEnv,
    NEXT_PUBLIC_ENABLE_DEBUG: serverConfig.features.enableDebugRoutes.toString(),
    NEXT_PUBLIC_ENABLE_MOCKS: serverConfig.features.enableMockServices.toString(),
    NEXT_PUBLIC_SENTRY_DSN: serverConfig.monitoring.sentryDsn || '',
    NEXT_PUBLIC_AUTH_URL: serverConfig.auth.nextAuthUrl || '',
  },
  
  experimental: {
    optimizeCss: serverConfig.nodeEnv === 'production',
  },
  
  compress: serverConfig.nodeEnv === 'production',
  poweredByHeader: false, // Security: hide X-Powered-By header
  generateEtags: serverConfig.nodeEnv === 'production',
  
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: serverConfig.nodeEnv === 'production' 
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';"
              : `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' ${serverConfig.api.baseUrl.replace('/api/v1', '')} https:; frame-ancestors 'none';`
          }
        ]
      }
    ];
  },
  
  // HTTPS redirects only for production
  async redirects() {
    return serverConfig.nodeEnv === 'production' ? [
      {
        source: '/(.*)',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: `https://${process.env.WEB_HOST}/:path*`,
        permanent: true
      }
    ] : [];
  }
};

export default nextConfig;