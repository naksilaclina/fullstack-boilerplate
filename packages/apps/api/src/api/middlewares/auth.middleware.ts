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
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

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