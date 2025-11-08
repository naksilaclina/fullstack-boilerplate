// Re-export from centralized monorepo configuration
export { 
  mongoConfig as config,
  nodeEnv, 
  isDevelopment, 
  isProduction, 
  isStaging, 
  isTest,
  mongodbUri as mongoUri
} from '../../../../config/index';

// Additional MongoDB-specific exports
import { mongoConfig } from '../../../../config/index';
export const database = mongoConfig.database;