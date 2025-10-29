import { Router, Request, Response } from "express";
import { SessionModel } from "@naksilaclina/mongodb";
import { authenticate } from "~api/middlewares";
import { verifyRefreshToken, invalidateRefreshToken } from "~api/services/auth/jwt.utils";

const router = Router();

// Helper function for conditional logging
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

/**
 * GET /api/v1/auth/sessions
 * Get all active sessions for the current user
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    // req.user is set by the authenticate middleware
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    // Find all sessions for the user
    const sessions = await SessionModel.find({ userId }).sort({ createdAt: -1 });
    
    // Return session data without sensitive information
    const sessionData = sessions.map(session => ({
      id: session._id,
      createdAt: session.createdAt,
      userAgent: session.userAgent,
      ipAddr: session.ipAddr,
      expiresAt: session.expiresAt,
    }));

    return res.status(200).json({
      message: "Sessions retrieved successfully",
      sessions: sessionData,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Sessions error:", error);
    }
    return res.status(500).json({
      error: "Internal server error while fetching sessions",
    });
  }
});

/**
 * DELETE /api/v1/auth/sessions/:id
 * Revoke a specific session
 */
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    // Find the session
    const session = await SessionModel.findOne({ _id: sessionId, userId });
    
    if (!session) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    // Invalidate the refresh token before deleting the session
    invalidateRefreshToken(session.refreshTokenId);

    // Delete the session
    await SessionModel.deleteOne({ _id: sessionId, userId });
    
    return res.status(200).json({
      message: "Session revoked successfully",
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Session revoke error:", error);
    }
    return res.status(500).json({
      error: "Internal server error while revoking session",
    });
  }
});

/**
 * DELETE /api/v1/auth/sessions
 * Revoke all sessions except the current one
 */
router.delete("/", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const refreshToken = req.cookies.refreshToken;
    
    if (!userId) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    // Get current session ID if available
    let currentSessionId: string | null = null;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) {
        currentSessionId = decoded.jti;
      }
    }

    // Find all sessions to be deleted
    const deleteQuery: any = { userId };
    if (currentSessionId) {
      deleteQuery.refreshTokenId = { $ne: currentSessionId };
    }
    
    // Get sessions that will be deleted to invalidate their refresh tokens
    const sessionsToRevoke = await SessionModel.find(deleteQuery);
    
    // Invalidate refresh tokens for all sessions being deleted
    for (const session of sessionsToRevoke) {
      invalidateRefreshToken(session.refreshTokenId);
    }
    
    // Delete all sessions except the current one
    await SessionModel.deleteMany(deleteQuery);
    
    return res.status(200).json({
      message: "All sessions revoked successfully",
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Sessions revoke error:", error);
    }
    return res.status(500).json({
      error: "Internal server error while revoking sessions",
    });
  }
});

export default router;