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
  suspiciousActivity: boolean;
  sessionType: string;
}

export interface SessionStats {
  totalActiveSessions: number;
  suspiciousSessions: number;
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
      suspiciousActivity: session.suspiciousActivity,
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
      suspiciousSessions,
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
        suspiciousActivity: true,
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
      suspiciousSessions,
      sessionsLast24h,
      uniqueDevices,
      uniqueLocations
    };
  }

  /**
   * Get suspicious sessions across all users (admin function)
   */
  static async getSuspiciousSessions(limit: number = 50): Promise<ISession[]> {
    return await SessionModel.find({
      suspiciousActivity: true,
      invalidatedAt: null,
      expiresAt: { $gt: new Date() }
    })
    .sort({ lastActivity: -1 })
    .limit(limit)
    .populate('userId', 'email firstName lastName');
  }

  /**
   * Get session analytics (admin function)
   */
  static async getSessionAnalytics(days: number = 7): Promise<{
    totalSessions: number;
    activeSessions: number;
    suspiciousSessions: number;
    averageSessionDuration: number;
    topCountries: Array<{ country: string; count: number }>;
    topDevices: Array<{ device: string; count: number }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const [
      totalSessions,
      activeSessions,
      suspiciousSessions,
      sessionsByCountry,
      sessionsByDevice
    ] = await Promise.all([
      SessionModel.countDocuments({
        createdAt: { $gte: startDate }
      }),
      SessionModel.countDocuments({
        invalidatedAt: null,
        expiresAt: { $gt: new Date() }
      }),
      SessionModel.countDocuments({
        suspiciousActivity: true,
        createdAt: { $gte: startDate }
      }),
      SessionModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$geoLocation.country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      SessionModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$userAgent", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Calculate average session duration
    const sessionsWithDuration = await SessionModel.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          invalidatedAt: { $ne: null }
        } 
      },
      {
        $project: {
          duration: { 
            $subtract: ["$invalidatedAt", "$createdAt"] 
          }
        }
      },
      {
        $group: {
          _id: null,
          averageDuration: { $avg: "$duration" }
        }
      }
    ]);

    const averageSessionDuration = sessionsWithDuration[0]?.averageDuration || 0;

    return {
      totalSessions,
      activeSessions,
      suspiciousSessions,
      averageSessionDuration: Math.round(averageSessionDuration / 1000 / 60), // Convert to minutes
      topCountries: sessionsByCountry.map(item => ({
        country: item._id || 'Unknown',
        count: item.count
      })),
      topDevices: sessionsByDevice.map(item => ({
        device: item._id ? item._id.substring(0, 50) + '...' : 'Unknown',
        count: item.count
      }))
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

  /**
   * Mark session as trusted (remove suspicious flag)
   */
  static async markSessionTrusted(sessionId: string): Promise<boolean> {
    const result = await SessionModel.updateOne(
      { refreshTokenId: sessionId },
      { 
        suspiciousActivity: false,
        $push: {
          adminActions: {
            action: 'mark_trusted',
            timestamp: new Date()
          }
        }
      }
    );

    return result.modifiedCount > 0;
  }
}