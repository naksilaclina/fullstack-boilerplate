export const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

export const mongodbUri =
  process.env.NODE_ENV === "development"
    ? process.env.MONGODB_DEV_URI ?? "mongodb://127.0.0.1:27017/naksilaclina-dev"
    : process.env.MONGODB_URI ?? "mongodb://localhost:27017/naksilaclina-dev";

export const isDevelopment = process.env.NODE_ENV === "development";

// JWT Configuration
export const jwtSecret = process.env.JWT_SECRET ?? "your-super-secret-jwt-key";
export const jwtRefreshSecret = process.env.REFRESH_TOKEN_SECRET ?? "your-super-secret-refresh-key";