import { Request, Response, NextFunction } from "express";
import { SessionModel } from "@naksilaclina/mongodb";
import { JwtPayload, verifyAccessToken } from "~api/services/auth/jwt.utils";
import { 
  generateDeviceFingerprint, 
  checkSuspiciousActivity, 
  updateSessionActivity,
  markSessionSuspicious 
} from "~api/services/auth/session.utils";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      sessionId?: string;
      deviceFingerprint?: string;
      suspiciousActivity?: boolean;
    }
  }
}

/**
 * Enhanced session validation middleware with security features
 */
export async function enhancedSessionValidation(req: Request, res: Response, next: NextFunction) {
  try {
    // Get the access token
    let token: string | undefined;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    if (!token && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ 
        error: "Access denied. No token provided.",
        code: "NO_TOKEN"
      });
    }

    // Verify the token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        error: "Invalid or expired token.",
        code: "INVALID_TOKEN"
      });
    }

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(req);
    req.deviceFingerprint = deviceFingerprint;

    // Find the session
    const session = await SessionModel.findOne({ 
      userId: decoded.userId,
      expiresAt: { $gt: new Date() },
      invalidatedAt: null
    });
    
    if (!session) {
      return res.status(401).json({ 
        error: "Session expired or invalid. Please log in again.",
        code: "SESSION_EXPIRED"
      });
    }

    // Check for device fingerprint mismatch
    if (session.deviceFingerprint !== deviceFingerprint) {
      await markSessionSuspicious(session.refreshTokenId, "Device fingerprint mismatch");
      
      return res.status(401).json({ 
        error: "Session security violation detected. Please log in again.",
        code: "DEVICE_MISMATCH"
      });
    }

    // Check for suspicious activity
    const clientIP = req.ip || req.connection.remoteAddress || '';
    const suspiciousChecks = await checkSuspiciousActivity(
      decoded.userId, 
      deviceFingerprint, 
      clientIP
    );

    // If multiple suspicious indicators, mark as suspicious
    const suspiciousCount = Object.values(suspiciousChecks).filter(Boolean).length;
    if (suspiciousCount >= 2) {
      await markSessionSuspicious(session.refreshTokenId, `Multiple suspicious indicators: ${JSON.stringify(suspiciousChecks)}`);
      req.suspiciousActivity = true;
      
      // Log security event
      console.warn('[SECURITY] Suspicious activity detected:', {
        userId: decoded.userId,
        sessionId: session.refreshTokenId,
        checks: suspiciousChecks,
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }

    // Update session activity
    await updateSessionActivity(session.refreshTokenId);

    // Attach user info and session data to request
    req.user = decoded;
    req.sessionId = session.refreshTokenId;
    
    next();
  } catch (error) {
    console.error('[SESSION] Enhanced session validation error:', error);
    return res.status(500).json({ 
      error: "Internal server error during session validation.",
      code: "SESSION_ERROR"
    });
  }
}

/**
 * Middleware to check session timeout and auto-refresh
 */
export async function sessionTimeoutCheck(req: Request, res: Response, next: NextFunction) {
  if (!req.sessionId) {
    return next();
  }

  try {
    const session = await SessionModel.findOne({ 
      refreshTokenId: req.sessionId 
    });

    if (!session) {
      return next();
    }

    // Check if session is close to expiring (within 1 hour)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    if (session.expiresAt < oneHourFromNow) {
      // Add header to indicate client should refresh token
      res.setHeader('X-Token-Refresh-Required', 'true');
    }

    // Check for session inactivity (more than 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (session.lastActivity < thirtyMinutesAgo) {
      // Mark as potentially inactive
      res.setHeader('X-Session-Warning', 'inactive');
    }

    next();
  } catch (error) {
    console.error('[SESSION] Timeout check error:', error);
    next();
  }
}

/**
 * Middleware for concurrent session management
 */
export async function concurrentSessionCheck(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next();
  }

  try {
    const activeSessions = await SessionModel.countDocuments({
      userId: req.user.userId,
      invalidatedAt: null,
      expiresAt: { $gt: new Date() }
    });

    // Add session count to response headers for client awareness
    res.setHeader('X-Active-Sessions', activeSessions.toString());

    // If too many sessions, log warning
    if (activeSessions > 10) {
      console.warn('[SECURITY] High number of concurrent sessions:', {
        userId: req.user.userId,
        sessionCount: activeSessions,
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    console.error('[SESSION] Concurrent session check error:', error);
    next();
  }
}

/**
 * Security logging middleware for session events
 */
export function sessionSecurityLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Log security-relevant session events
  const isSecurityRelevant = 
    req.path.includes('/auth/') ||
    req.path.includes('/logout') ||
    req.path.includes('/refresh') ||
    req.suspiciousActivity;

  if (isSecurityRelevant) {
    const logData = {
      event: 'session_activity',
      userId: req.user?.userId,
      sessionId: req.sessionId,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      deviceFingerprint: req.deviceFingerprint,
      suspiciousActivity: req.suspiciousActivity || false,
      timestamp: new Date().toISOString()
    };

    console.log('[SESSION_SECURITY]', logData);
  }

  // Log response time for performance monitoring
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 1000) { // Log slow requests
      console.warn('[SESSION_PERFORMANCE] Slow session validation:', {
        path: req.path,
        duration: `${duration}ms`,
        userId: req.user?.userId
      });
    }
  });

  next();
}