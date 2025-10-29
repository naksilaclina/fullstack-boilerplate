import { Router, Request, Response } from "express";
import { SessionModel } from "@naksilaclina/mongodb";
import { verifyRefreshToken, invalidateRefreshToken } from "~api/services/auth/jwt.utils";

const router = Router();

// Helper function for conditional logging
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
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
    
    // If refresh token exists, invalidate the session
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) {
        // Delete the session from database
        await SessionModel.deleteOne({ refreshTokenId: decoded.jti });
        // Invalidate the refresh token to prevent reuse
        invalidateRefreshToken(decoded.jti);
      }
    }

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    // Clear the access token cookie
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Logout error:", error);
    }
    return res.status(500).json({
      error: "Internal server error during logout",
    });
  }
});

export default router;