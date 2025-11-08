import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "~api/services/auth/jwt.utils";
import { SessionModel } from "@naksilaclina/mongodb";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      sessionId?: string;
    }
  }
}

/**
 * Authentication middleware to protect routes
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    
    // First, check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, check for token in cookies
    if (!token && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // If no token, return unauthorized
    if (!token) {
      return res.status(401).json({ 
        error: "Access denied. No token provided." 
      });
    }

    // Verify the token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        error: "Invalid or expired token." 
      });
    }

    // Check if the user's session is still valid in the database
    let session;
    
    if (decoded.sessionId) {
      // If token has sessionId, use it for direct lookup
      session = await SessionModel.findOne({ 
        refreshTokenId: decoded.sessionId,
        userId: decoded.userId,
        invalidatedAt: null,
        expiresAt: { $gt: new Date() }
      });
    } else {
      // Fallback: Find any active session by userId (for backward compatibility)
      session = await SessionModel.findOne({ 
        userId: decoded.userId,
        invalidatedAt: null,
        expiresAt: { $gt: new Date() }
      });
    }
    
    if (!session) {
      return res.status(401).json({ 
        error: "Session expired or invalid. Please log in again." 
      });
    }

    // Attach user info and session ID to the request
    req.user = { ...decoded, sessionId: session.refreshTokenId };
    req.sessionId = session.refreshTokenId;
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal server error during authentication." 
    });
  }
}