import { Request, Response, NextFunction } from "express";
import { verifyRefreshToken, JwtPayload } from "~api/services/auth/jwt.utils";

declare global {
  namespace Express {
    interface Request {
      refreshToken?: JwtPayload;
    }
  }
}

/**
 * Refresh token middleware to validate refresh tokens
 */
export async function validateRefreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    // Get the refresh token from cookies
    const refreshToken = req.cookies.refreshToken;

    // If no refresh token, return unauthorized
    if (!refreshToken) {
      return res.status(401).json({ 
        error: "Access denied. No refresh token provided." 
      });
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return res.status(401).json({ 
        error: "Invalid or expired refresh token." 
      });
    }

    // Attach user info to the request
    req.refreshToken = decoded;
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal server error during refresh token validation." 
    });
  }
}