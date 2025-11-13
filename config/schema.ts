import Joi from 'joi';

/**
 * Monorepo Environment Configuration Schema
 * Single source of truth for all applications (API, Web, MongoDB)
 */
export const monorepoConfigSchema = Joi.object({
  // Global Environment
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development')
    .description('Application environment'),

  // API Server Configuration
  API_PORT: Joi.number()
    .port()
    .default(5000)
    .description('API server port'),
  
  API_HOST: Joi.string()
    .default('localhost')
    .description('API server host'),

  // Web Application Configuration
  WEB_PORT: Joi.number()
    .port()
    .default(3000)
    .description('Web application port'),

  WEB_HOST: Joi.string()
    .default('localhost')
    .description('Web application host'),

  // Database Configuration (MongoDB Module)
  MONGODB_URI: Joi.string()
    .uri()
    .required()
    .description('MongoDB connection URI'),

  MONGODB_DEV_URI: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .description('Development MongoDB URI'),

  MONGODB_ENCRYPTION_KEY: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .description('MongoDB encryption key'),

  MONGODB_CA_CERT_PATH: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
    .description('MongoDB CA certificate path'),

  MONGODB_SSL_VALIDATE: Joi.boolean()
    .default(true)
    .description('MongoDB SSL validation'),

  // Authentication & Security (Shared across API and Web)
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT signing secret'),

  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT refresh token secret'),

  JWT_EXPIRES_IN: Joi.string()
    .default('24h')
    .description('JWT token expiration'),

  REFRESH_TOKEN_EXPIRES_IN: Joi.string()
    .default('7d')
    .description('Refresh token expiration'),

  // CORS Configuration (API)
  CLIENT_URL: Joi.string()
    .required()
    .description('Allowed client URLs (comma-separated)'),

  // Security Configuration (API)
  CSP_REPORT_URI: Joi.string()
    .default('/api/v1/security/csp-report')
    .description('CSP violation report endpoint'),

  CSP_REPORT_ONLY: Joi.boolean()
    .default(true)
    .description('CSP report-only mode'),

  SECURITY_LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
    .description('Security logging level'),

  // Rate Limiting (API)
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(900000) // 15 minutes
    .description('Rate limit window in milliseconds'),

  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .default(100)
    .description('Maximum requests per window'),

  AUTH_RATE_LIMIT_MAX: Joi.number()
    .default(5)
    .description('Max auth attempts per window'),

  // SSL/TLS Configuration (Production)
  SSL_CERT_PATH: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
    .description('SSL certificate path'),

  SSL_KEY_PATH: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
    .description('SSL private key path'),

  // Feature Flags (Global)
  ENABLE_SEEDING: Joi.boolean()
    .default(false)
    .description('Enable database seeding'),

  FORCE_SEED: Joi.boolean()
    .default(false)
    .description('Force database re-seeding'),

  RUN_SEED: Joi.boolean()
    .default(false)
    .description('Run seeding on startup'),

  // Development Features
  ENABLE_DEBUG_ROUTES: Joi.boolean()
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    })
    .description('Enable debug/test routes'),

  ENABLE_SWAGGER: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.valid('development', 'staging'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    })
    .description('Enable Swagger documentation'),

  ENABLE_HOT_RELOAD: Joi.boolean()
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    })
    .description('Enable hot reloading'),

  ENABLE_MOCK_SERVICES: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.valid('development', 'test'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    })
    .description('Enable mock external services'),

  // Performance & Optimization
  ENABLE_COMPRESSION: Joi.boolean()
    .default(true)
    .description('Enable response compression'),

  MAX_REQUEST_SIZE: Joi.string()
    .default('10mb')
    .description('Maximum request body size'),

  ENABLE_CACHE: Joi.boolean()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    })
    .description('Enable response caching'),

  // Monitoring & Observability
  SENTRY_DSN: Joi.string()
    .uri()
    .allow('') // Allow empty strings
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
    .description('Sentry error tracking DSN'),

  DATADOG_API_KEY: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
    .description('DataDog monitoring API key'),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'trace')
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.string().default('debug'),
      otherwise: Joi.string().default('info')
    })
    .description('Application log level'),

  // Next.js Specific (Web App)
  NEXT_PUBLIC_API_BASE_URL: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.string().default('http://localhost:5000/api/v1'),
      otherwise: Joi.optional()
    })
    .description('Public API base URL for Next.js'),

  NEXTAUTH_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .description('NextAuth.js secret'),

  NEXTAUTH_URL: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .description('NextAuth.js URL'),

  // Build & Deployment
  BUILD_ANALYZE: Joi.boolean()
    .default(false)
    .description('Enable bundle analysis'),

  WEBPACK_BUNDLE_ANALYZER: Joi.boolean()
    .default(false)
    .description('Enable webpack bundle analyzer')

}).unknown(true); // Allow system environment variables

/**
 * Validation options
 */
export const validationOptions = {
  allowUnknown: true,
  stripUnknown: true,
  abortEarly: false, // Show all validation errors
  convert: true // Convert string values to appropriate types
};