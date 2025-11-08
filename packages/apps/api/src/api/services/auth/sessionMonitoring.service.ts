import { SessionModel, ISession } from "@naksilaclina/mongodb";
import { cleanupExpiredSessions } from "./session.utils";

export interface SessionMetrics {
  totalActiveSessions: number;
  suspiciousSessionsCount: number;
  expiredSessionsCount: number;
  sessionsPerUser: { [userId: string]: number };
  deviceTypes: { [type: string]: number };
  geoDistribution: { [country: string]: number };
}

export interface SecurityAlert {
  type: 'SUSPICIOUS_ACTIVITY' | 'CONCURRENT_LIMIT_EXCEEDED' | 'UNUSUAL_LOCATION' | 'DEVICE_MISMATCH';
  userId: string;
  sessionId: string;
  details: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Service for monitoring and managing session security
 */
export class SessionMonitoringService {
  private static instance: SessionMonitoringService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private securityAlerts: SecurityAlert[] = [];

  private constructor() {}

  public static getInstance(): SessionMonitoringService {
    if (!SessionMonitoringService.instance) {
      SessionMonitoringService.instance = new SessionMonitoringService();
    }
    return SessionMonitoringService.instance;
  }

  /**
   * Start automatic session monitoring and cleanup
   */
  public startMonitoring(): void {
    // Cleanup expired sessions every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('Session cleanup error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Monitor for suspicious activity every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitorSuspiciousActivity();
      } catch (error) {
        console.error('Session monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('Session monitoring service started');
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Session monitoring service stopped');
  }

  /**
   * Perform session cleanup
   */
  private async performCleanup(): Promise<void> {
    const beforeCount = await SessionModel.countDocuments({});
    
    // Clean up expired sessions
    await cleanupExpiredSessions();
    
    // Clean up sessions with suspicious activity older than 7 days
    await SessionModel.deleteMany({
      suspiciousActivity: true,
      createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const afterCount = await SessionModel.countDocuments({});
    const cleanedCount = beforeCount - afterCount;

    if (cleanedCount > 0) {
      console.log(`Session cleanup completed: ${cleanedCount} sessions removed`);
    }
  }

  /**
   * Monitor for suspicious activity patterns
   */
  private async monitorSuspiciousActivity(): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for users with too many concurrent sessions
    const concurrentSessionsAgg = await SessionModel.aggregate([
      {
        $match: {
          invalidatedAt: null,
          expiresAt: { $gt: now }
        }
      },
      {
        $group: {
          _id: '$userId',
          sessionCount: { $sum: 1 },
          maxAllowed: { $first: '$maxConcurrentSessions' }
        }
      },
      {
        $match: {
          $expr: { $gt: ['$sessionCount', '$maxAllowed'] }
        }
      }
    ]);

    for (const result of concurrentSessionsAgg) {
      this.addSecurityAlert({
        type: 'CONCURRENT_LIMIT_EXCEEDED',
        userId: result._id,
        sessionId: 'multiple',
        details: `User has ${result.sessionCount} active sessions, max allowed: ${result.maxAllowed}`,
        timestamp: now,
        severity: 'MEDIUM'
      });
    }

    // Check for rapid session creation (potential brute force)
    const rapidSessionsAgg = await SessionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: '$userId',
          sessionCount: { $sum: 1 }
        }
      },
      {
        $match: {
          sessionCount: { $gte: 5 } // More than 5 sessions in an hour
        }
      }
    ]);

    for (const result of rapidSessionsAgg) {
      this.addSecurityAlert({
        type: 'SUSPICIOUS_ACTIVITY',
        userId: result._id,
        sessionId: 'multiple',
        details: `Rapid session creation: ${result.sessionCount} sessions in the last hour`,
        timestamp: now,
        severity: 'HIGH'
      });
    }

    // Check for sessions from unusual locations
    const unusualLocationSessions = await SessionModel.find({
      suspiciousActivity: true,
      createdAt: { $gte: oneHourAgo }
    });

    for (const session of unusualLocationSessions) {
      this.addSecurityAlert({
        type: 'UNUSUAL_LOCATION',
        userId: session.userId,
        sessionId: session.refreshTokenId,
        details: `Session from unusual location: ${session.geoLocation.country}, ${session.geoLocation.city}`,
        timestamp: session.createdAt,
        severity: 'MEDIUM'
      });
    }
  }

  /**
   * Add security alert
   */
  private addSecurityAlert(alert: SecurityAlert): void {
    this.securityAlerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.securityAlerts.length > 100) {
      this.securityAlerts = this.securityAlerts.slice(-100);
    }

    // Log high severity alerts
    if (alert.severity === 'HIGH') {
      console.warn('HIGH SEVERITY SECURITY ALERT:', alert);
    }
  }

  /**
   * Get session metrics
   */
  public async getSessionMetrics(): Promise<SessionMetrics> {
    const now = new Date();

    // Get active sessions
    const activeSessions = await SessionModel.find({
      invalidatedAt: null,
      expiresAt: { $gt: now }
    });

    // Get suspicious sessions
    const suspiciousSessionsCount = await SessionModel.countDocuments({
      suspiciousActivity: true,
      invalidatedAt: null,
      expiresAt: { $gt: now }
    });

    // Get expired sessions
    const expiredSessionsCount = await SessionModel.countDocuments({
      expiresAt: { $lt: now }
    });

    // Calculate sessions per user
    const sessionsPerUser: { [userId: string]: number } = {};
    activeSessions.forEach(session => {
      sessionsPerUser[session.userId] = (sessionsPerUser[session.userId] || 0) + 1;
    });

    // Calculate device types distribution
    const deviceTypes: { [type: string]: number } = {};
    activeSessions.forEach(session => {
      const type = session.sessionType || 'unknown';
      deviceTypes[type] = (deviceTypes[type] || 0) + 1;
    });

    // Calculate geo distribution
    const geoDistribution: { [country: string]: number } = {};
    activeSessions.forEach(session => {
      const country = session.geoLocation?.country || 'Unknown';
      geoDistribution[country] = (geoDistribution[country] || 0) + 1;
    });

    return {
      totalActiveSessions: activeSessions.length,
      suspiciousSessionsCount,
      expiredSessionsCount,
      sessionsPerUser,
      deviceTypes,
      geoDistribution
    };
  }

  /**
   * Get recent security alerts
   */
  public getSecurityAlerts(limit: number = 50): SecurityAlert[] {
    return this.securityAlerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Force cleanup of all expired sessions
   */
  public async forceCleanup(): Promise<{ cleanedCount: number }> {
    const beforeCount = await SessionModel.countDocuments({});
    await this.performCleanup();
    const afterCount = await SessionModel.countDocuments({});
    
    return {
      cleanedCount: beforeCount - afterCount
    };
  }

  /**
   * Get session statistics for a specific user
   */
  public async getUserSessionStats(userId: string): Promise<{
    activeSessions: number;
    suspiciousSessions: number;
    recentLogins: number;
    deviceCount: number;
    locationCount: number;
  }> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      activeSessions,
      suspiciousSessions,
      recentSessions,
      allUserSessions
    ] = await Promise.all([
      SessionModel.countDocuments({
        userId,
        invalidatedAt: null,
        expiresAt: { $gt: now }
      }),
      SessionModel.countDocuments({
        userId,
        suspiciousActivity: true,
        invalidatedAt: null,
        expiresAt: { $gt: now }
      }),
      SessionModel.countDocuments({
        userId,
        createdAt: { $gte: last24Hours }
      }),
      SessionModel.find({
        userId,
        invalidatedAt: null,
        expiresAt: { $gt: now }
      })
    ]);

    // Count unique devices and locations
    const uniqueDevices = new Set(allUserSessions.map(s => s.deviceFingerprint));
    const uniqueLocations = new Set(allUserSessions.map(s => 
      `${s.geoLocation?.country || 'Unknown'}-${s.geoLocation?.city || 'Unknown'}`
    ));

    return {
      activeSessions,
      suspiciousSessions,
      recentLogins: recentSessions,
      deviceCount: uniqueDevices.size,
      locationCount: uniqueLocations.size
    };
  }
}

// Export singleton instance
export const sessionMonitoringService = SessionMonitoringService.getInstance();