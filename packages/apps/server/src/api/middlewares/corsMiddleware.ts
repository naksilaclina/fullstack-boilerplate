import cors from "cors";

import { config } from "../../config";

// Get CORS origins from centralized config
const corsOrigins = config.security.corsOrigins;

const corsMiddleware = cors({
  origin: corsOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  exposedHeaders: ["Authorization"]
});

export default corsMiddleware;