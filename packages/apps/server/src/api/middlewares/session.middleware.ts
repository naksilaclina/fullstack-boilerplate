import { Request, Response, NextFunction } from "express";
import { isProduction } from "../../config";

/**
 * Simple session validation middleware
 */

interface SessionRequest extends Request {
  sessionId?: string;
  user?: any;
}

/**
 * Basic session tracking without breaking API flow
 */
export function sessionTrackingMiddleware(req: SessionRequest, res: Response, next: NextFunction) {
  // Generate or retrieve session ID
  const sessionId = req.headers['x-session-id'] as string || 
                   req.cookies?.sessionId || 
                   Math.random().toString(36).substring(2, 15);

  req.sessionId = sessionId;

  // Set session cookie if not exists
  if (!req.cookies?.sessionId) {

    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict', // Enhanced CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  next();
}

/**
 * Optional session validation (doesn't block requests)
 */
export function sessionValidationMiddleware(req: SessionRequest, res: Response, next: NextFunction) {
  const sessionId = req.sessionId;
  
  if (sessionId) {
    // Log session activity for monitoring
    console.log('Session Activity:', {
      sessionId,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }

  next();
}