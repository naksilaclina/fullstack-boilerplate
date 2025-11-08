import { Router, Request, Response } from "express";
import { SessionModel, ISession } from "@naksilaclina/mongodb";
import { authenticate } from "~api/middlewares";
import {
    verifyRefreshToken,
    invalidateRefreshToken,
    signAccessToken,
    signRefreshToken
} from "~api/services/auth/jwt.utils";
import {
    createEnhancedSession,
    updateSessionActivity,
    checkSuspiciousActivity,
    markSessionSuspicious,
    getUserActiveSessions,
    invalidateAllUserSessions,
    cleanupExpiredSessions,
    generateDeviceFingerprint,
    getGeoLocation
} from "~api/services/auth/session.utils";

const router = Router();

import { isDevelopment, isProduction } from "../../../config";

// Helper function for conditional logging
const devLog = (...args: any[]) => {
    if (isDevelopment) {
        console.log(...args);
    }
};

/**
 * GET /api/v1/sessions
 * Get all active sessions for the current user with enhanced security info
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                error: "User not authenticated",
            });
        }

        // Get active sessions with enhanced information
        const sessions = await getUserActiveSessions(userId);

        // Return session data with security information
        const sessionData = sessions.map(session => ({
            id: session._id,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            userAgent: session.userAgent,
            ipAddress: session.geoLocation.ip,
            deviceFingerprint: session.deviceFingerprint.substring(0, 8) + '...', // Partial fingerprint for security
            geoLocation: session.geoLocation,
            sessionType: session.sessionType,
            suspiciousActivity: session.suspiciousActivity,
            expiresAt: session.expiresAt,
            isCurrent: session.refreshTokenId === req.user?.sessionId
        }));

        return res.status(200).json({
            message: "Sessions retrieved successfully",
            sessions: sessionData,
            totalActiveSessions: sessionData.length,
            maxConcurrentSessions: sessions[0]?.maxConcurrentSessions || 5
        });
    } catch (error) {
        devLog("Enhanced sessions error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching sessions",
        });
    }
});

/**
 * POST /api/v1/sessions/refresh
 * Enhanced session refresh with security checks
 */
router.post("/refresh", async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                error: "Refresh token not provided",
            });
        }

        // Verify refresh token
        const decoded = await verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                error: "Invalid refresh token",
            });
        }

        // Find the session
        const session = await SessionModel.findOne({
            refreshTokenId: decoded.jti,
            invalidatedAt: null,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            return res.status(401).json({
                error: "Session not found or expired",
            });
        }

        // Generate current device fingerprint
        const currentFingerprint = generateDeviceFingerprint(req);
        const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

        // Security checks
        const suspiciousChecks = await checkSuspiciousActivity(
            session.userId,
            currentFingerprint,
            clientIP
        );

        // Check if device fingerprint matches
        if (session.deviceFingerprint !== currentFingerprint) {
            await markSessionSuspicious(session.refreshTokenId, 'Device fingerprint mismatch');
            return res.status(401).json({
                error: "Device fingerprint mismatch - session invalidated for security",
            });
        }

        // Update session activity
        await updateSessionActivity(session.refreshTokenId);

        // Generate new tokens
        const newAccessToken = signAccessToken({
            userId: session.userId,
            sessionId: session.refreshTokenId
        });

        // For refresh token, we need to find the user document
        const { UserModel } = await import("@naksilaclina/mongodb");
        const user = await UserModel.findById(session.userId);
        if (!user) {
            return res.status(401).json({
                error: "User not found",
            });
        }

        const newRefreshToken = signRefreshToken(user);

        // Set new refresh token cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
            message: "Session refreshed successfully",
            accessToken: newAccessToken,
            sessionInfo: {
                lastActivity: new Date(),
                suspiciousActivity: session.suspiciousActivity,
                securityChecks: suspiciousChecks
            }
        });

    } catch (error) {
        devLog("Session refresh error:", error);
        return res.status(500).json({
            error: "Internal server error during session refresh",
        });
    }
});

/**
 * DELETE /api/v1/sessions/:id
 * Revoke a specific session with enhanced security logging
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

        // Log security event
        devLog(`Session revoked by user: ${userId}, session: ${sessionId}`);

        // Invalidate the refresh token and mark session as invalidated
        await invalidateRefreshToken(session.refreshTokenId);
        await SessionModel.updateOne(
            { _id: sessionId },
            { invalidatedAt: new Date() }
        );

        return res.status(200).json({
            message: "Session revoked successfully",
            revokedSession: {
                id: session._id,
                deviceFingerprint: session.deviceFingerprint.substring(0, 8) + '...',
                lastActivity: session.lastActivity
            }
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
 * Revoke all sessions except the current one with enhanced security
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
        let currentSessionId: string | undefined = undefined;
        if (refreshToken) {
            const decoded = await verifyRefreshToken(refreshToken);
            if (decoded) {
                currentSessionId = decoded.jti;
            }
        }

        // Get sessions that will be invalidated for logging
        const sessionsToRevoke = await SessionModel.find({
            userId,
            invalidatedAt: null,
            ...(currentSessionId && { refreshTokenId: { $ne: currentSessionId } })
        });

        // Log security event
        devLog(`Bulk session revocation by user: ${userId}, sessions count: ${sessionsToRevoke.length}`);

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
 * GET /api/v1/sessions/security-status
 * Get security status and suspicious activity for current user
 */
router.get("/security-status", authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                error: "User not authenticated",
            });
        }

        // Get current device fingerprint and IP
        const currentFingerprint = generateDeviceFingerprint(req);
        const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

        // Check for suspicious activity
        const suspiciousChecks = await checkSuspiciousActivity(userId, currentFingerprint, clientIP);

        // Get recent suspicious sessions
        const suspiciousSessions = await SessionModel.find({
            userId,
            suspiciousActivity: true,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }).sort({ createdAt: -1 }).limit(5);

        // Get active sessions count
        const activeSessions = await getUserActiveSessions(userId);

        return res.status(200).json({
            message: "Security status retrieved successfully",
            securityStatus: {
                suspiciousActivityChecks: suspiciousChecks,
                recentSuspiciousSessions: suspiciousSessions.length,
                activeSessionsCount: activeSessions.length,
                maxConcurrentSessions: activeSessions[0]?.maxConcurrentSessions || 5,
                currentDeviceFingerprint: currentFingerprint.substring(0, 8) + '...',
                currentLocation: await getGeoLocation(clientIP)
            }
        });

    } catch (error) {
        devLog("Security status error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching security status",
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