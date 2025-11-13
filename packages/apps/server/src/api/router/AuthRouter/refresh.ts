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
 * OPTIONS /api/v1/auth/refresh
 * Handle CORS preflight requests
 */
router.options("/", (req: Request, res: Response) => {
  devLog("✅ OPTIONS preflight request to refresh endpoint", {
    timestamp: new Date().toISOString(),
    origin: req.get("Origin"),
    method: req.get("Access-Control-Request-Method"),
    headers: req.get("Access-Control-Request-Headers")
  });
  
  // CORS headers are already handled by the CORS middleware
  // Just return 204 No Content for preflight
  return res.status(204).end();
});

/**
 * GET /api/v1/auth/refresh
 * Handle GET requests to refresh endpoint (unexpected)
 */
router.get("/", (req: Request, res: Response) => {
  // Log the unexpected GET request for debugging
  console.error("🚨 UNEXPECTED GET request to refresh endpoint - FULL DETAILS:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    ip: getClientIP(req),
    referer: req.get("Referer"),
    origin: req.get("Origin"),
    contentType: req.get("Content-Type"),
    accept: req.get("Accept"),
    allHeaders: req.headers,
    query: req.query,
    body: req.body,
    cookies: req.cookies
  });
  
  // Return 405 Method Not Allowed for GET requests with detailed information
  return res.status(405).json({
    error: "Method not allowed. Use POST method to refresh tokens.",
    message: "The refresh endpoint only accepts POST requests. This typically happens when a browser or client makes a direct request to this endpoint instead of using the application's refresh functionality.",
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
    solution: "Make sure your application is using the proper refresh token mechanism through the API client."
  });
});

/**
 * HEAD /api/v1/auth/refresh
 * Handle HEAD requests to refresh endpoint (unexpected)
 */
router.head("/", (req: Request, res: Response) => {
  // Log the unexpected HEAD request for debugging
  devLog("Unexpected HEAD request to refresh endpoint", {
    timestamp: new Date().toISOString(),
    userAgent: req.get("User-Agent"),
    ip: req.ip
  });
  
  // Return 405 Method Not Allowed for HEAD requests
  return res.status(405).json({
    error: "Method not allowed. Use POST method to refresh tokens.",
    message: "The refresh endpoint only accepts POST requests. This typically happens when a browser or client makes a direct request to this endpoint instead of using the application's refresh functionality.",
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
    solution: "Make sure your application is using the proper refresh token mechanism through the API client."
  });
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    devLog("POST Token refresh attempt started", { 
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get("User-Agent"),
      ip: getClientIP(req)
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
    devLog("POST Token refresh completed successfully", {
      timestamp: new Date().toISOString(),
      userId: user._id,
      sessionId: sessionId
    });
    
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