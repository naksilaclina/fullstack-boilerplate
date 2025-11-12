import { SessionModel, ISession } from "@naksilaclina/mongodb";
import { 
  getUserActiveSessions, 
  invalidateAllUserSessions,
  cleanupExpiredSessions 
} from "./session.utils";

export interface SessionInfo {
  sessionId: string;
  deviceFingerprint: string;
  userAgent?: string;
  ipAddress: string;
  geoLocation: {
    country?: string;
    city?: string;
    ip: string;
  };
  lastActivity: Date;
  createdAt: Date;
  sessionType: string;
}

export interface SessionStats {
  totalActiveSessions: number;
  sessionsLast24h: number;
  uniqueDevices: number;
  uniqueLocations: number;
}

/**
 * Session Management Service
 */
export class SessionManagementService {
  
  /**
   * Get user's active sessions with detailed info
   */
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await getUserActiveSessions(userId);
    
    return sessions.map(session => ({
      sessionId: session.refreshTokenId,
      deviceFingerprint: session.deviceFingerprint,
      userAgent: session.userAgent,
      ipAddress: session.geoLocation.ip,
      geoLocation: session.geoLocation,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      sessionType: session.sessionType
    }));
  }

  /**
   * Terminate specific session
   */
  static async terminateSession(userId: string, sessionId: string): Promise<boolean> {
    const result = await SessionModel.updateOne(
      { 
        userId, 
        refreshTokenId: sessionId,
        invalidatedAt: null 
      },
      { invalidatedAt: new Date() }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Terminate all sessions except current
   */
  static async terminateAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const result = await SessionModel.updateMany(
      { 
        userId,
        refreshTokenId: { $ne: currentSessionId },
        invalidatedAt: null 
      },
      { invalidatedAt: new Date() }
    );

    return result.modifiedCount;
  }

  /**
   * Get session statistics for user
   */
  static async getUserSessionStats(userId: string): Promise<SessionStats> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [
      totalActiveSessions,
      sessionsLast24h,
      allSessions
    ] = await Promise.all([
      SessionModel.countDocuments({
        userId,
        invalidatedAt: null,
        expiresAt: { $gt: new Date() }
      }),
      SessionModel.countDocuments({
        userId,
        createdAt: { $gte: twentyFourHoursAgo }
      }),
      SessionModel.find({
        userId,
        invalidatedAt: null,
        expiresAt: { $gt: new Date() }
      }, 'deviceFingerprint geoLocation.country geoLocation.city')
    ]);

    const uniqueDevices = new Set(allSessions.map(s => s.deviceFingerprint)).size;
    const uniqueLocations = new Set(
      allSessions.map(s => `${s.geoLocation.country}-${s.geoLocation.city}`)
    ).size;

    return {
      totalActiveSessions,
      sessionsLast24h,
      uniqueDevices,
      uniqueLocations
    };
  }

  /**
   * Cleanup expired sessions (maintenance function)
   */
  static async performSessionCleanup(): Promise<{
    expiredSessionsRemoved: number;
    invalidatedSessionsRemoved: number;
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [expiredResult, invalidatedResult] = await Promise.all([
      SessionModel.deleteMany({
        expiresAt: { $lt: new Date() }
      }),
      SessionModel.deleteMany({
        invalidatedAt: { $lt: thirtyDaysAgo }
      })
    ]);

    return {
      expiredSessionsRemoved: expiredResult.deletedCount || 0,
      invalidatedSessionsRemoved: invalidatedResult.deletedCount || 0
    };
  }

  /**
   * Force logout user from all devices
   */
  static async forceLogoutUser(userId: string, reason: string = 'Administrative action'): Promise<number> {
    const result = await SessionModel.updateMany(
      { 
        userId,
        invalidatedAt: null 
      },
      { 
        invalidatedAt: new Date(),
        $push: {
          adminActions: {
            action: 'force_logout',
            reason,
            timestamp: new Date()
          }
        }
      }
    );

    // Log the administrative action
    console.log('[ADMIN_ACTION] Force logout user:', {
      userId,
      reason,
      sessionsTerminated: result.modifiedCount,
      timestamp: new Date().toISOString()
    });

    return result.modifiedCount;
  }
}