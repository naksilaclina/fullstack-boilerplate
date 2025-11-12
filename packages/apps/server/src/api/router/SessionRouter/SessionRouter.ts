import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "~api/middlewares/auth.middleware";
import { 
  invalidateAllUserSessions, 
  getUserActiveSessions,
  cleanupExpiredSessions,
  getGeoLocation
} from "~api/services/auth";
import { SessionModel } from "@naksilaclina/mongodb";
import { isDevelopment } from "../../../config";

// Helper function for conditional logging
const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

const router = Router();

/**
 * GET /api/v1/sessions
 * Get all active sessions for current user
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                error: "User not authenticated",
            });
        }

        const sessions = await getUserActiveSessions(userId);
        
        return res.status(200).json({
            message: "Sessions retrieved successfully",
            sessions: sessions.map(session => ({
                id: session._id,
                refreshTokenId: session.refreshTokenId,
                userAgent: session.userAgent,
                deviceFingerprint: session.deviceFingerprint,
                lastActivity: session.lastActivity,
                expiresAt: session.expiresAt,
                sessionType: session.sessionType,
                createdAt: session.createdAt,
            })),
        });
    } catch (error) {
        devLog("Sessions fetch error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching sessions",
        });
    }
});

/**
 * DELETE /api/v1/sessions/:id
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

        // Find the session to ensure it belongs to the user
        const session = await SessionModel.findOne({
            _id: sessionId,
            userId,
        });

        if (!session) {
            return res.status(404).json({
                error: "Session not found or does not belong to user",
            });
        }

        // Invalidate the session
        await SessionModel.updateOne(
            { _id: sessionId },
            { invalidatedAt: new Date() }
        );

        return res.status(200).json({
            message: "Session revoked successfully",
        });
    } catch (error) {
        devLog("Session revoke error:", error);
        return res.status(500).json({
            error: "Internal server error while revoking session",
        });
    }
});

/**
 * DELETE /api/v1/sessions
 * Revoke all sessions except current
 */
router.delete("/", authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const currentSessionId = req.sessionId;

        if (!userId) {
            return res.status(401).json({
                error: "User not authenticated",
            });
        }

        // Get all user sessions except current
        const sessionsToRevoke = await SessionModel.find({
            userId,
            refreshTokenId: { $ne: currentSessionId },
            invalidatedAt: null,
        });

        // Invalidate all sessions except current
        await invalidateAllUserSessions(userId, currentSessionId);

        return res.status(200).json({
            message: "All sessions revoked successfully",
            revokedSessionsCount: sessionsToRevoke.length,
            currentSessionPreserved: !!currentSessionId
        });
    } catch (error) {
        devLog("Sessions bulk revoke error:", error);
        return res.status(500).json({
            error: "Internal server error while revoking sessions",
        });
    }
});

/**
 * POST /api/v1/sessions/cleanup
 * Manual cleanup of expired sessions (admin or user action)
 */
router.post("/cleanup", authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                error: "User not authenticated",
            });
        }

        // Count sessions before cleanup
        const beforeCount = await SessionModel.countDocuments({
            userId,
            $or: [
                { expiresAt: { $lt: new Date() } },
                { invalidatedAt: { $ne: null } }
            ]
        });

        // Cleanup expired and invalidated sessions for this user
        await SessionModel.deleteMany({
            userId,
            $or: [
                { expiresAt: { $lt: new Date() } },
                { invalidatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Older than 1 day
            ]
        });

        return res.status(200).json({
            message: "Session cleanup completed successfully",
            cleanedSessionsCount: beforeCount
        });

    } catch (error) {
        devLog("Session cleanup error:", error);
        return res.status(500).json({
            error: "Internal server error during session cleanup",
        });
    }
});

/**
 * PUT /api/v1/sessions/security-settings
 * Update session security settings
 */
router.put("/security-settings", authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { maxConcurrentSessions } = req.body;

        if (!userId) {
            return res.status(401).json({
                error: "User not authenticated",
            });
        }

        // Validate maxConcurrentSessions
        if (maxConcurrentSessions && (maxConcurrentSessions < 1 || maxConcurrentSessions > 10)) {
            return res.status(400).json({
                error: "Max concurrent sessions must be between 1 and 10",
            });
        }

        // Update all user sessions with new settings
        await SessionModel.updateMany(
            { userId, invalidatedAt: null },
            { maxConcurrentSessions: maxConcurrentSessions || 5 }
        );

        return res.status(200).json({
            message: "Security settings updated successfully",
            settings: {
                maxConcurrentSessions: maxConcurrentSessions || 5
            }
        });

    } catch (error) {
        devLog("Security settings update error:", error);
        return res.status(500).json({
            error: "Internal server error while updating security settings",
        });
    }
});

export default router