import { Router, Request, Response } from "express";
import { SessionModel } from "@naksilaclina/mongodb";
import { verifyRefreshToken, invalidateRefreshToken } from "~api/services/auth";

const router = Router();

import { isDevelopment, isProduction } from "../../../config";

// Helper function for conditional logging
const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * POST /api/v1/auth/logout
 * Logout endpoint
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    // Get the refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    
    // If refresh token exists, delete the session from database
    if (refreshToken) {
      const decoded = await verifyRefreshToken(refreshToken);
      if (decoded) {
        // Delete the session from database completely
        await SessionModel.deleteOne({ refreshTokenId: decoded.jti });
        // Also invalidate the refresh token to prevent any reuse
        await invalidateRefreshToken(decoded.jti);
      }
    }

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax", // Changed from "strict" to "lax" for consistency
      path: "/",
    });

    // Clear the access token cookie
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax", // Changed from "strict" to "lax" for consistency
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    if (isDevelopment) {
      console.error("Logout error:", error);
    }
    return res.status(500).json({
      error: "Internal server error during logout",
    });
  }
});

export default router;