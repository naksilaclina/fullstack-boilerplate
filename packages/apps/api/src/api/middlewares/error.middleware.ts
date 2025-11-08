import { Request, Response, NextFunction } from "express";
import { isProduction } from "../../config";

/**
 * Development-friendly error handling middleware
 */

interface SecurityError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Safe error handler that preserves API communication
 */
export const errorHandler = (
  err: SecurityError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error safely without breaking API
  console.error('API Error:', {
    message: err.message,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  const statusCode = err.statusCode || 500;

  // Always return JSON for API consistency
  const errorResponse = {
    error: isProduction 
      ? (statusCode >= 500 ? 'Internal server error' : err.message)
      : err.message,
    timestamp: new Date().toISOString(),
    ...(!isProduction && { stack: err.stack })
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`) as SecurityError;
  error.statusCode = 404;
  
  next(error);
};