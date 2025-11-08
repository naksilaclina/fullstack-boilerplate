import { Request, Response, NextFunction } from "express";
import { SessionModel } from "@naksilaclina/mongodb";
import { verifyAccessToken, signAccessToken, JwtPayload } from "~api/services/auth/jwt.utils";
import { updateSessionActivity, markSessionSuspicious } from "~api/services/auth/session.utils";

// Session timeout configuration (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const AUTO_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

declare global {
  namespace Express {
    interface Request {
      sessionTimeout?: {
        isExpired: boolean;
        shouldRefresh: boolean;
        timeUntilExpiry: number;
      };
    }
  }
}

/**
 * Middleware to handle automatic session timeout and renewal
 */
export const sessionTimeoutMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      next();
      return;
    }

    // If token doesn't have sessionId, skip session-specific checks
    if (!decoded.sessionId) {
      next();
      return;
    }

    // Find the session
    const session = await SessionModel.findOne({
      refreshTokenId: decoded.sessionId,
      invalidatedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      res.status(401).json({
        error: "Session not found or expired",
        code: "SESSION_NOT_FOUND"
      });
      return;
    }

    const now = new Date();
    const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();

    // Check if session has timed out due to inactivity
    if (timeSinceLastActivity > SESSION_TIMEOUT) {
      // Mark session as expired due to timeout
      await SessionModel.updateOne(
        { _id: session._id },
        { invalidatedAt: now }
      );

      await markSessionSuspicious(session.refreshTokenId, 'Session timeout due to inactivity');

      res.status(401).json({
        error: "Session expired due to inactivity",
        code: "SESSION_TIMEOUT",
        lastActivity: session.lastActivity,
        timeoutDuration: SESSION_TIMEOUT
      });
      return;
    }

    // Update session activity
    await updateSessionActivity(session.refreshTokenId);

    // Check if session should be auto-refreshed
    const shouldRefresh = timeUntilExpiry < AUTO_REFRESH_THRESHOLD && timeUntilExpiry > 0;

    // Add session timeout info to request
    req.sessionTimeout = {
      isExpired: timeUntilExpiry <= 0,
      shouldRefresh,
      timeUntilExpiry
    };

    // If session should be refreshed, add refresh header
    if (shouldRefresh) {
      res.setHeader('X-Session-Refresh-Required', 'true');
      res.setHeader('X-Session-Expires-In', Math.floor(timeUntilExpiry / 1000).toString());
    }

    next();
  } catch (error) {
    console.error('Session timeout middleware error:', error);
    next();
  }
};

/**
 * Middleware to enforce concurrent session limits
 */
export const concurrentSessionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    if (!decoded || !decoded.userId) {
      next();
      return;
    }

    // Check active sessions count
    const activeSessions = await SessionModel.countDocuments({
      userId: decoded.userId,
      invalidatedAt: null,
      expiresAt: { $gt: new Date() }
    });

    // Get max concurrent sessions from any active session
    const sampleSession = await SessionModel.findOne({
      userId: decoded.userId,
      invalidatedAt: null,
      expiresAt: { $gt: new Date() }
    });

    const maxConcurrentSessions = sampleSession?.maxConcurrentSessions || 5;

    if (activeSessions > maxConcurrentSessions) {
      // This shouldn't happen if properly enforced during login, but handle it
      console.warn(`User ${decoded.userId} has ${activeSessions} active sessions, max allowed: ${maxConcurrentSessions}`);
      
      // Invalidate oldest sessions
      const oldestSessions = await SessionModel.find({
        userId: decoded.userId,
        invalidatedAt: null,
        expiresAt: { $gt: new Date() }
      }).sort({ lastActivity: 1 }).limit(activeSessions - maxConcurrentSessions);

      const sessionIds = oldestSessions.map(s => s._id);
      await SessionModel.updateMany(
        { _id: { $in: sessionIds } },
        { invalidatedAt: new Date() }
      );
    }

    next();
  } catch (error) {
    console.error('Concurrent session middleware error:', error);
    next();
  }
};

/**
 * Middleware to detect and handle suspicious activity
 */
export const suspiciousActivityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      next();
      return;
    }

    // If token doesn't have sessionId, skip session-specific checks
    if (!decoded.sessionId) {
      next();
      return;
    }

    // Find the session
    const session = await SessionModel.findOne({
      refreshTokenId: decoded.sessionId,
      invalidatedAt: null
    });

    if (!session) {
      next();
      return;
    }

    // Check if session is marked as suspicious
    if (session.suspiciousActivity) {
      // Log the suspicious activity attempt
      console.warn(`Suspicious activity detected for session: ${session.refreshTokenId}, User: ${session.userId}`);
      
      // You might want to require additional verification here
      res.setHeader('X-Suspicious-Activity-Detected', 'true');
      
      // For now, we'll allow the request but flag it
      // In production, you might want to require 2FA or block the request
    }

    // Check for rapid requests (simple rate limiting per session)
    const recentRequests = await SessionModel.findOne({
      refreshTokenId: decoded.sessionId,
      lastActivity: { $gte: new Date(Date.now() - 60 * 1000) } // Last minute
    });

    if (recentRequests) {
      // Increment a counter or implement more sophisticated rate limiting
      // For now, just log it
      console.log(`Active session making requests: ${session.refreshTokenId}`);
    }

    next();
  } catch (error) {
    console.error('Suspicious activity middleware error:', error);
    next();
  }
};

export default {
  sessionTimeoutMiddleware,
  concurrentSessionMiddleware,
  suspiciousActivityMiddleware
};