import { Router, Request, Response } from "express";
import { SessionModel, UserModel, type IUserDocument } from "@naksilaclina/mongodb";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, invalidateRefreshToken, createEnhancedSession } from "~api/services/auth";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Helper function to get client IP address
const getClientIP = (req: Request): string => {
  // Check for various headers that might contain the real client IP
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  // Fallback to req.ip which should work correctly with trust proxy setting
  return req.ip;
};

import { isDevelopment, isProduction } from "../../../config";

// Helper function for conditional logging
const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    devLog("Token refresh attempt started", { 
      timestamp: new Date().toISOString()
    });

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      devLog("No refresh token provided");
      return res.status(401).json({
        error: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
      devLog("Invalid refresh token");
      return res.status(401).json({
        error: "Invalid refresh token",
      });
    }

    devLog("Refresh token verified", { jti: decoded.jti, userId: decoded.userId });

    // Check if refresh token is blacklisted
    // (This would be implemented in a production environment)
    
    // Find user
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      devLog("User not found for refresh token", { userId: decoded.userId });
      return res.status(401).json({
        error: "User not found",
      });
    }

    devLog("User found for refresh", { userId: user._id, isActive: user.isActive });

    // Check if account is active
    if (!user.isActive) {
      devLog("Account is deactivated during refresh", { userId: user._id });
      return res.status(401).json({
        error: "Account is deactivated",
      });
    }

    // Find and delete the existing session
    await SessionModel.deleteOne({ refreshTokenId: decoded.jti });
    
    // Invalidate the old refresh token (rotation)
    await invalidateRefreshToken(decoded.jti);

    // Create new session record
    const sessionId = uuidv4();
    const clientIP = getClientIP(req);
    
    const session = await createEnhancedSession({
      userId: user._id.toString(),
      refreshTokenId: sessionId,
      ipAddress: clientIP,
      userAgent: req.get("User-Agent"),
      sessionType: 'web',
      maxConcurrentSessions: 5
    }, req);
    devLog("New session created during refresh", { sessionId, userId: user._id, clientIP });

    // Generate new tokens with session ID
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: sessionId
    });
    const newRefreshToken = await generateRefreshToken(user._id.toString(), sessionId);

    // Set new refresh token in HTTP-only cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax", // Changed from "strict" to "lax" to allow refresh token to be sent on page refresh
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    // Set new access token in HTTP-only cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax", // Changed from "strict" to "lax" to allow access token to be sent on page refresh
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    // Return success message
    return res.status(200).json({
      message: "Token refresh successful",
    });
  } catch (error) {
    if (isDevelopment) {
      console.error("Token refresh error:", error);
    }
    return res.status(500).json({
      error: "Internal server error during token refresh",
    });
  }
});

export default router;