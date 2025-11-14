import { Request, Response, NextFunction } from "express";
import { SessionModel } from "@naksilaclina/mongodb";
import { JwtPayload, verifyAccessToken } from "~api/services/auth";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      sessionId?: string;
    }
  }
}

/**
 * Session validation middleware to check if the session is still valid in the database
 */
export async function validateSession(req: Request, res: Response, next: NextFunction) {
  try {
    // Get the access token to extract session information
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
    // Find session by userId (from the decoded token)
    const session = await SessionModel.findOne({ 
      userId: decoded.userId,
      expiresAt: { $gt: new Date() } // Check if session hasn't expired
    });
    
    if (!session) {
      return res.status(401).json({ 
        error: "Session expired or invalid. Please log in again." 
      });
    }

    // Attach user info and session ID to the request
    req.user = decoded;
    req.sessionId = session.refreshTokenId;
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal server error during session validation." 
    });
  }
}