import { initJwtSecrets } from "./utils";

/**
 * Initialize the auth module with configuration from the main config
 * This should be called during application startup
 */
export function initAuthModule(jwtSecret: string, jwtRefreshSecret: string) {
  initJwtSecrets(jwtSecret, jwtRefreshSecret);
}