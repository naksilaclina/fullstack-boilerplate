"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtRefreshSecret = exports.jwtSecret = exports.mongodbUri = exports.port = exports.isTest = exports.isStaging = exports.isProduction = exports.isDevelopment = exports.nodeEnv = exports.mongoConfig = exports.webConfig = exports.apiConfig = exports.config = exports.validateRuntimeConfig = exports.getMongoConfig = exports.getWebConfig = exports.getApiConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const schema_1 = require("./schema");
// Load environment variables from root .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '.env') });
/**
 * Validate environment variables
 */
function validateEnvironment() {
    const { error, value } = schema_1.monorepoConfigSchema.validate(process.env, schema_1.validationOptions);
    if (error) {
        const errorMessages = error.details.map(detail => {
            return `${detail.path.join('.')}: ${detail.message}`;
        }).join('\n');
        console.error('❌ Monorepo Environment Configuration Validation Failed:');
        console.error(errorMessages);
        console.error('\n📋 Please check your .env file and ensure all required variables are set.');
        // Environment-specific hints
        if (process.env.NODE_ENV === 'development') {
            console.error('\n💡 Development Hints:');
            console.error('- Copy .env.example to .env');
            console.error('- Run: npm run generate-secrets');
            console.error('- Check MongoDB connection string');
        }
        if (process.env.NODE_ENV === 'production') {
            console.error('\n🚨 Production Requirements:');
            console.error('- Ensure all secrets are properly set');
            console.error('- Verify SSL certificates');
            console.error('- Check monitoring configuration');
        }
        process.exit(1);
    }
    return value;
}
/**
 * Create monorepo configuration
 */
function createMonorepoConfig(env) {
    const apiPort = env.API_PORT;
    const webPort = env.WEB_PORT;
    const apiHost = env.API_HOST;
    const webHost = env.WEB_HOST;
    return {
        nodeEnv: env.NODE_ENV,
        api: {
            port: apiPort,
            host: apiHost,
            baseUrl: env.NODE_ENV === 'development'
                ? `http://${apiHost}:${apiPort}`
                : `https://${apiHost}`,
        },
        web: {
            port: webPort,
            host: webHost,
            baseUrl: env.NODE_ENV === 'development'
                ? `http://${webHost}:${webPort}`
                : `https://${webHost}`,
        },
        database: {
            uri: env.NODE_ENV === 'development' && env.MONGODB_DEV_URI
                ? env.MONGODB_DEV_URI
                : env.MONGODB_URI,
            devUri: env.MONGODB_DEV_URI,
            encryptionKey: env.MONGODB_ENCRYPTION_KEY,
            ssl: {
                validate: env.MONGODB_SSL_VALIDATE,
                caCertPath: env.MONGODB_CA_CERT_PATH,
            },
        },
        auth: {
            jwtSecret: env.JWT_SECRET,
            jwtRefreshSecret: env.JWT_REFRESH_SECRET,
            jwtExpiresIn: env.JWT_EXPIRES_IN,
            refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
            nextAuthSecret: env.NEXTAUTH_SECRET,
            nextAuthUrl: env.NEXTAUTH_URL,
        },
        security: {
            corsOrigins: env.CLIENT_URL.split(',').map((url) => url.trim()),
            csp: {
                reportUri: env.CSP_REPORT_URI,
                reportOnly: env.CSP_REPORT_ONLY,
            },
            rateLimiting: {
                windowMs: env.RATE_LIMIT_WINDOW_MS,
                maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
                authMaxRequests: env.AUTH_RATE_LIMIT_MAX,
            },
            logLevel: env.SECURITY_LOG_LEVEL,
            ssl: env.SSL_CERT_PATH && env.SSL_KEY_PATH ? {
                certPath: env.SSL_CERT_PATH,
                keyPath: env.SSL_KEY_PATH,
            } : undefined,
        },
        features: {
            enableSeeding: env.ENABLE_SEEDING,
            forceSeed: env.FORCE_SEED,
            runSeed: env.RUN_SEED,
            enableDebugRoutes: env.ENABLE_DEBUG_ROUTES,
            enableSwagger: env.ENABLE_SWAGGER,
            enableCompression: env.ENABLE_COMPRESSION,
            enableCache: env.ENABLE_CACHE,
            enableHotReload: env.ENABLE_HOT_RELOAD,
            enableMockServices: env.ENABLE_MOCK_SERVICES,
        },
        monitoring: {
            sentryDsn: env.SENTRY_DSN,
            datadogApiKey: env.DATADOG_API_KEY,
            logLevel: env.LOG_LEVEL,
        },
        performance: {
            maxRequestSize: env.MAX_REQUEST_SIZE,
        },
        build: {
            analyze: env.BUILD_ANALYZE,
            webpackAnalyzer: env.WEBPACK_BUNDLE_ANALYZER,
        },
    };
}
/**
 * Application-specific configuration extractors
 */
function getApiConfig(config) {
    return {
        server: config.api,
        database: config.database,
        auth: config.auth,
        security: config.security,
        features: config.features,
        monitoring: config.monitoring,
        performance: config.performance,
        nodeEnv: config.nodeEnv,
    };
}
exports.getApiConfig = getApiConfig;
function getWebConfig(config) {
    return {
        server: config.web,
        api: {
            baseUrl: config.api.baseUrl + '/api/v1',
        },
        auth: {
            nextAuthSecret: config.auth.nextAuthSecret,
            nextAuthUrl: config.auth.nextAuthUrl,
        },
        features: config.features,
        monitoring: config.monitoring,
        build: config.build,
        nodeEnv: config.nodeEnv,
    };
}
exports.getWebConfig = getWebConfig;
function getMongoConfig(config) {
    return {
        database: config.database,
        features: {
            enableSeeding: config.features.enableSeeding,
            forceSeed: config.features.forceSeed,
        },
        monitoring: config.monitoring,
        nodeEnv: config.nodeEnv,
    };
}
exports.getMongoConfig = getMongoConfig;
/**
 * Environment-aware configuration logging
 */
function logMonorepoConfiguration(config) {
    console.log(`🚀 Monorepo Environment: ${config.nodeEnv.toUpperCase()}`);
    console.log('================================');
    console.log(`📡 API Server: ${config.api.baseUrl}`);
    console.log(`🌐 Web Server: ${config.web.baseUrl}`);
    console.log(`🗄️  Database: ${config.database.uri.replace(/\/\/.*@/, '//***:***@')}`);
    if (config.nodeEnv === 'development') {
        console.log(`🔧 Debug Routes: ${config.features.enableDebugRoutes ? 'Enabled' : 'Disabled'}`);
        console.log(`📚 Swagger: ${config.features.enableSwagger ? 'Enabled' : 'Disabled'}`);
        console.log(`🔄 Hot Reload: ${config.features.enableHotReload ? 'Enabled' : 'Disabled'}`);
        console.log(`🎭 Mock Services: ${config.features.enableMockServices ? 'Enabled' : 'Disabled'}`);
    }
    if (config.nodeEnv === 'production') {
        console.log(`🔒 SSL: ${config.security.ssl ? 'Enabled' : 'Disabled'}`);
        console.log(`📊 Monitoring: ${config.monitoring.sentryDsn ? 'Sentry' : 'None'}`);
        console.log(`💾 Cache: ${config.features.enableCache ? 'Enabled' : 'Disabled'}`);
    }
    console.log('================================');
}
/**
 * Runtime configuration validation
 */
function validateRuntimeConfig(config) {
    const errors = [];
    const warnings = [];
    // Environment-specific validations
    if (config.nodeEnv === 'production') {
        if (!config.monitoring.sentryDsn) {
            warnings.push('No error monitoring configured for production');
        }
        if (config.features.enableDebugRoutes) {
            errors.push('Debug routes should be disabled in production');
        }
        if (config.security.csp.reportOnly) {
            warnings.push('CSP is in report-only mode in production');
        }
        if (!config.auth.nextAuthSecret) {
            errors.push('NextAuth secret is required in production');
        }
    }
    if (config.nodeEnv === 'development') {
        if (!config.database.devUri) {
            warnings.push('Using production database in development');
        }
    }
    // Security validations
    if (config.auth.jwtSecret.length < 32) {
        errors.push('JWT secret must be at least 32 characters');
    }
    if (config.auth.jwtRefreshSecret.length < 32) {
        errors.push('JWT refresh secret must be at least 32 characters');
    }
    // Port conflicts
    if (config.api.port === config.web.port) {
        errors.push('API and Web ports cannot be the same');
    }
    // Show warnings
    if (warnings.length > 0) {
        console.warn('⚠️  Configuration Warnings:');
        warnings.forEach(warning => console.warn(`- ${warning}`));
    }
    // Show errors and exit if any
    if (errors.length > 0) {
        console.error('❌ Runtime Configuration Errors:');
        errors.forEach(error => console.error(`- ${error}`));
        process.exit(1);
    }
}
exports.validateRuntimeConfig = validateRuntimeConfig;
// Initialize and export monorepo configuration
const validatedEnv = validateEnvironment();
exports.config = createMonorepoConfig(validatedEnv);
// Validate runtime configuration
validateRuntimeConfig(exports.config);
// Log configuration (non-sensitive parts)
logMonorepoConfiguration(exports.config);
// Export application-specific configurations
exports.apiConfig = getApiConfig(exports.config);
exports.webConfig = getWebConfig(exports.config);
exports.mongoConfig = getMongoConfig(exports.config);
// Environment helpers
exports.nodeEnv = exports.config.nodeEnv;
exports.isDevelopment = exports.nodeEnv === 'development';
exports.isProduction = exports.nodeEnv === 'production';
exports.isStaging = exports.nodeEnv === 'staging';
exports.isTest = exports.nodeEnv === 'test';
// Legacy exports for backward compatibility
exports.port = exports.config.api.port;
exports.mongodbUri = exports.config.database.uri;
exports.jwtSecret = exports.config.auth.jwtSecret;
exports.jwtRefreshSecret = exports.config.auth.jwtRefreshSecret;
