import { Request, Response, NextFunction } from "express";

/**
 * Lightweight monitoring middleware that doesn't interfere with API communication
 */

interface MonitoringOptions {
  logRequests?: boolean;
  performanceTracking?: boolean;
}

/**
 * Safe request monitoring middleware
 */
import { isDevelopment } from "../../config";

export function monitoringMiddleware(options: MonitoringOptions = {}) {
  const {
    logRequests = isDevelopment,
    performanceTracking = true
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);

    // Add request ID to request object for tracking
    (req as any).requestId = requestId;

    // Only log API requests (not Next.js page requests)
    if (logRequests && req.url.startsWith('/api/')) {
      console.log('API Request:', {
        requestId,
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
      });
    }

    // Track response time without breaking the response
    const originalSend = res.send;
    res.send = function(body) {
      const responseTime = Date.now() - startTime;
      
      if (performanceTracking) {
        // Log slow requests (>1000ms)
        if (responseTime > 1000) {
          console.warn('Slow API Request:', {
            requestId,
            method: req.method,
            path: req.path,
            responseTime: `${responseTime}ms`,
            statusCode: res.statusCode
          });
        }

        // Log error responses with appropriate levels
        if (res.statusCode >= 500) {
          console.error('API Server Error:', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`
          });
        } else if (res.statusCode >= 400) {
          // Only log client errors if they're not auth-related 401s (too noisy)
          if (res.statusCode !== 401) {
            console.warn('API Client Error:', {
              requestId,
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              responseTime: `${responseTime}ms`
            });
          }
        } else if (logRequests && responseTime > 500 && !req.path.includes('/auth/')) {
          // Only log successful non-auth requests if they take more than 500ms
          console.log('API Success:', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`
          });
        }
      }

      return originalSend.call(this, body);
    };

    next();
  };
}