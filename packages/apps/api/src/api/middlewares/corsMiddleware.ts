import cors from "cors";

// Parse multiple origins from environment variable or use default
const corsOrigins = process.env.CLIENT_URL ? 
  process.env.CLIENT_URL.split(',').map(origin => origin.trim()) : 
  ["http://localhost:3000"];

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