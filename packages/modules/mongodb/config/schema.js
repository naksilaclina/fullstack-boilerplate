"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationOptions = exports.monorepoConfigSchema = void 0;
const joi_1 = __importDefault(require("joi"));
/**
 * Monorepo Environment Configuration Schema
 * Single source of truth for all applications (API, Web, MongoDB)
 */
exports.monorepoConfigSchema = joi_1.default.object({
    // Global Environment
    NODE_ENV: joi_1.default.string()
        .valid('development', 'staging', 'production', 'test')
        .default('development')
        .description('Application environment'),
    // API Server Configuration
    API_PORT: joi_1.default.number()
        .port()
        .default(5000)
        .description('API server port'),
    API_HOST: joi_1.default.string()
        .default('localhost')
        .description('API server host'),
    // Web Application Configuration
    WEB_PORT: joi_1.default.number()
        .port()
        .default(3000)
        .description('Web application port'),
    WEB_HOST: joi_1.default.string()
        .default('localhost')
        .description('Web application host'),
    // Database Configuration (MongoDB Module)
    MONGODB_URI: joi_1.default.string()
        .uri()
        .required()
        .description('MongoDB connection URI'),
    MONGODB_DEV_URI: joi_1.default.string()
        .uri()
        .when('NODE_ENV', {
        is: 'development',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .description('Development MongoDB URI'),
    MONGODB_ENCRYPTION_KEY: joi_1.default.string()
        .min(32)
        .when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .description('MongoDB encryption key'),
    MONGODB_CA_CERT_PATH: joi_1.default.string()
        .when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.optional(),
        otherwise: joi_1.default.optional()
    })
        .description('MongoDB CA certificate path'),
    MONGODB_SSL_VALIDATE: joi_1.default.boolean()
        .default(true)
        .description('MongoDB SSL validation'),
    // Authentication & Security (Shared across API and Web)
    JWT_SECRET: joi_1.default.string()
        .min(32)
        .required()
        .description('JWT signing secret'),
    JWT_REFRESH_SECRET: joi_1.default.string()
        .min(32)
        .required()
        .description('JWT refresh token secret'),
    JWT_EXPIRES_IN: joi_1.default.string()
        .default('24h')
        .description('JWT token expiration'),
    REFRESH_TOKEN_EXPIRES_IN: joi_1.default.string()
        .default('7d')
        .description('Refresh token expiration'),
    // CORS Configuration (API)
    CLIENT_URL: joi_1.default.string()
        .required()
        .description('Allowed client URLs (comma-separated)'),
    // Security Configuration (API)
    CSP_REPORT_URI: joi_1.default.string()
        .default('/api/v1/security/csp-report')
        .description('CSP violation report endpoint'),
    CSP_REPORT_ONLY: joi_1.default.boolean()
        .default(true)
        .description('CSP report-only mode'),
    SECURITY_LOG_LEVEL: joi_1.default.string()
        .valid('error', 'warn', 'info', 'debug')
        .default('info')
        .description('Security logging level'),
    // Rate Limiting (API)
    RATE_LIMIT_WINDOW_MS: joi_1.default.number()
        .default(900000) // 15 minutes
        .description('Rate limit window in milliseconds'),
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number()
        .default(100)
        .description('Maximum requests per window'),
    AUTH_RATE_LIMIT_MAX: joi_1.default.number()
        .default(5)
        .description('Max auth attempts per window'),
    // SSL/TLS Configuration (Production)
    SSL_CERT_PATH: joi_1.default.string()
        .when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.optional(),
        otherwise: joi_1.default.optional()
    })
        .description('SSL certificate path'),
    SSL_KEY_PATH: joi_1.default.string()
        .when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.optional(),
        otherwise: joi_1.default.optional()
    })
        .description('SSL private key path'),
    // Feature Flags (Global)
    ENABLE_SEEDING: joi_1.default.boolean()
        .default(false)
        .description('Enable database seeding'),
    FORCE_SEED: joi_1.default.boolean()
        .default(false)
        .description('Force database re-seeding'),
    RUN_SEED: joi_1.default.boolean()
        .default(false)
        .description('Run seeding on startup'),
    // Development Features
    ENABLE_DEBUG_ROUTES: joi_1.default.boolean()
        .when('NODE_ENV', {
        is: 'development',
        then: joi_1.default.boolean().default(true),
        otherwise: joi_1.default.boolean().default(false)
    })
        .description('Enable debug/test routes'),
    ENABLE_SWAGGER: joi_1.default.boolean()
        .when('NODE_ENV', {
        is: joi_1.default.valid('development', 'staging'),
        then: joi_1.default.boolean().default(true),
        otherwise: joi_1.default.boolean().default(false)
    })
        .description('Enable Swagger documentation'),
    ENABLE_HOT_RELOAD: joi_1.default.boolean()
        .when('NODE_ENV', {
        is: 'development',
        then: joi_1.default.boolean().default(true),
        otherwise: joi_1.default.boolean().default(false)
    })
        .description('Enable hot reloading'),
    ENABLE_MOCK_SERVICES: joi_1.default.boolean()
        .when('NODE_ENV', {
        is: joi_1.default.valid('development', 'test'),
        then: joi_1.default.boolean().default(true),
        otherwise: joi_1.default.boolean().default(false)
    })
        .description('Enable mock external services'),
    // Performance & Optimization
    ENABLE_COMPRESSION: joi_1.default.boolean()
        .default(true)
        .description('Enable response compression'),
    MAX_REQUEST_SIZE: joi_1.default.string()
        .default('10mb')
        .description('Maximum request body size'),
    ENABLE_CACHE: joi_1.default.boolean()
        .when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.boolean().default(true),
        otherwise: joi_1.default.boolean().default(false)
    })
        .description('Enable response caching'),
    // Monitoring & Observability
    SENTRY_DSN: joi_1.default.string()
        .uri()
        .when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.optional(),
        otherwise: joi_1.default.optional()
    })
        .description('Sentry error tracking DSN'),
    DATADOG_API_KEY: joi_1.default.string()
        .when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.optional(),
        otherwise: joi_1.default.optional()
    })
        .description('DataDog monitoring API key'),
    LOG_LEVEL: joi_1.default.string()
        .valid('error', 'warn', 'info', 'debug', 'trace')
        .when('NODE_ENV', {
        is: 'development',
        then: joi_1.default.string().default('debug'),
        otherwise: joi_1.default.string().default('info')
    })
        .description('Application log level'),
    // Next.js Specific (Web App)
    NEXT_PUBLIC_API_BASE_URL: joi_1.default.string()
        .uri()
        .when('NODE_ENV', {
        is: 'development',
        then: joi_1.default.string().default('http://localhost:5000/api/v1'),
        otherwise: joi_1.default.optional()
    })
        .description('Public API base URL for Next.js'),
    NEXTAUTH_SECRET: joi_1.default.string()
        .min(32)
        .when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .description('NextAuth.js secret'),
    NEXTAUTH_URL: joi_1.default.string()
        .uri()
        .when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .description('NextAuth.js URL'),
    // Build & Deployment
    BUILD_ANALYZE: joi_1.default.boolean()
        .default(false)
        .description('Enable bundle analysis'),
    WEBPACK_BUNDLE_ANALYZER: joi_1.default.boolean()
        .default(false)
        .description('Enable webpack bundle analyzer')
}).unknown(true); // Allow system environment variables
/**
 * Validation options
 */
exports.validationOptions = {
    allowUnknown: true,
    stripUnknown: true,
    abortEarly: false,
    convert: true // Convert string values to appropriate types
};
