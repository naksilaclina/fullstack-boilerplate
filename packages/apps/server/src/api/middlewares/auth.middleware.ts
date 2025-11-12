import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload, generateDeviceFingerprint, checkSuspiciousActivity, updateSessionActivity, markSessionSuspicious } from "~api/services/auth";
import { SessionModel } from "@naksilaclina/mongodb";


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
 * Enhanced authentication middleware with security features
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
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
      error: "Internal server error during authentication.",
      code: "SESSION_ERROR"
    });
  }
}