import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "~api/services/auth/jwt.utils";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
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

    // Attach user info to the request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal server error during authentication." 
    });
  }
}