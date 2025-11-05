export const port = process.env.API_PORT ? parseInt(process.env.API_PORT) : 5000;

export const mongodbUri =
  process.env.NODE_ENV === "development"
    ? process.env.MONGODB_DEV_URI ?? "mongodb://127.0.0.1:27017/naksilaclina-dev"
    : process.env.MONGODB_URI ?? "mongodb://localhost:27017/naksilaclina-dev";

export const isDevelopment = process.env.NODE_ENV === "development";

// JWT Configuration
// Check for production environment and ensure secrets are properly configured
const isProduction = process.env.NODE_ENV === 'production';

// JWT Configuration with proper validation
export const jwtSecret = process.env.JWT_SECRET;
export const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

// In production, ensure secrets are properly configured
if (isProduction) {
  if (!jwtSecret || jwtSecret.length < 32) {
    console.error('❌ CRITICAL: JWT_SECRET is not set or is too short in production environment');
    console.error('Please set a strong JWT_SECRET with at least 32 characters');
    process.exit(1);
  }
  
  if (!jwtRefreshSecret || jwtRefreshSecret.length < 32) {
    console.error('❌ CRITICAL: JWT_REFRESH_SECRET is not set or is too short in production environment');
    console.error('Please set a strong JWT_REFRESH_SECRET with at least 32 characters');
    process.exit(1);
  }
} else {
  // In development, if secrets are not set, warn but allow to continue
  if (!jwtSecret) {
    console.warn('⚠️  WARNING: JWT_SECRET is not set, using generated development secret');
    console.warn('⚠️  This is NOT secure for production use!');
  }
  
  if (!jwtRefreshSecret) {
    console.warn('⚠️  WARNING: JWT_REFRESH_SECRET is not set, using generated development secret');
    console.warn('⚠️  This is NOT secure for production use!');
  }
}