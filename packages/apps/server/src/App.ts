import express, { type Application as ExpressApp, Request, Response, NextFunction } from "express";
import { type Server as HttpServer } from "http";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import csrf from "csurf";
import {
  type Mongoose,
  connect as connectToMongodb,
} from "@naksilaclina/mongodb";
import { port, mongodbUri, config } from "./config";
import { api } from "./api";
import { securityMiddleware, generalRateLimiter } from "./api/middlewares";
import { monitoringMiddleware } from "./api/middlewares/monitoring.middleware";
import { sessionTrackingMiddleware } from "./api/middlewares/session.middleware";
import { errorHandler, notFoundHandler } from "./api/middlewares/error.middleware";

export default class App {
  public express: ExpressApp;
  public httpServer?: HttpServer;
  public mongoose?: Mongoose;

  constructor() {
    this.express = express();
    // Configure trust proxy with specific IP ranges for security
    // This allows us to get the real client IP while preventing IP spoofing
    this.express.set('trust proxy', 'loopback'); // Only trust loopback addresses
    this.express.use(compression());
    this.express.use(cookieParser());
    // Get CORS origins from centralized config
    const corsOrigins = config.security.corsOrigins;
      
    this.express.use(cors({
      origin: corsOrigins,
      credentials: true,
    }));
    
    // Add monitoring middleware first (for request tracking)
    this.express.use(monitoringMiddleware({
      logRequests: config.nodeEnv === 'development',
      performanceTracking: true
    }));
    
    // Add session tracking
    this.express.use(sessionTrackingMiddleware);
    
    // Session security features are now handled in the authenticate middleware
    
    // Apply security middleware
    this.express.use(securityMiddleware);
    this.express.use(generalRateLimiter);
    
    // CSRF protection middleware
    const csrfProtection = csrf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      }
    });
    
    // Apply CSRF protection to API routes
    this.express.use('/api', csrfProtection);
    
    // Route to provide CSRF token to frontend
    this.express.get('/api/csrf-token', (req: Request, res: Response) => {
      res.json({ csrfToken: (req as any).csrfToken() });
    });
    
    console.log("Mounting API routes at /api/v1");
    this.express.use("/api/v1", api);
    console.log("API routes mounted");
    
    // Add 404 handler for undefined routes
    this.express.use(notFoundHandler);
    
    // Add global error handler (must be last)
    this.express.use(errorHandler);
  }

  async start() {
    try {
      this.mongoose = await connectToMongodb(mongodbUri);
      console.log(`Connected to MongoDB`);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }

    return new Promise<void>((resolve) => {
      this.httpServer = this.express.listen(port, () => {
        console.log(`Server started on port ${port}`);
        // Log all registered routes
        const routes: string[] = [];
        this.express._router.stack.forEach((r: any) => {
          if (r.route && r.route.path) {
            routes.push(`${Object.keys(r.route.methods)} ${r.route.path}`);
          }
        });
        console.log("Registered routes:", routes);
        resolve();
      });
    });
  }

  async stop() {
    if (this.mongoose) {
      console.log("Disconnecting from MongoDB");
      await this.mongoose?.disconnect();
    }

    if (this.httpServer) {
      console.log("Stopping the HTTP server");
      this.httpServer?.close();
    }
  }
}