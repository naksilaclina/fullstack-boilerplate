import { createHash } from "crypto";
import { Request } from "express";
import { SessionModel, ISession } from "@naksilaclina/mongodb";

export interface DeviceFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  platform?: string;
  screenResolution?: string;
}

export interface SessionCreationOptions {
  userId: string;
  refreshTokenId: string;
  ipAddress: string;
  userAgent?: string;
  sessionType?: "web" | "mobile" | "api";
  maxConcurrentSessions?: number;
}

/**
 * Generate device fingerprint from request headers
 */
export function generateDeviceFingerprint(req: Request): string {
  const fingerprint: DeviceFingerprint = {
    userAgent: req.get('User-Agent') || '',
    acceptLanguage: req.get('Accept-Language') || '',
    acceptEncoding: req.get('Accept-Encoding') || '',
    platform: req.get('Sec-CH-UA-Platform') || '',
    screenResolution: req.get('X-Screen-Resolution') || '',
  };

  const fingerprintString = JSON.stringify(fingerprint);
  return createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Extract geolocation from IP (simplified version - in production use a proper GeoIP service)
 */
export async function getGeoLocation(ip: string): Promise<{ country?: string; city?: string; ip: string }> {
  // In production, integrate with a GeoIP service like MaxMind, IPinfo, or similar
  // For now, return a basic structure
  return {
    country: ip.startsWith('127.') || ip.startsWith('192.168.') ? 'Local' : 'Unknown',
    city: ip.startsWith('127.') || ip.startsWith('192.168.') ? 'Local' : 'Unknown',
    ip: ip
  };
}

/**
 * Create enhanced session with security features
 */
export async function createEnhancedSession(options: SessionCreationOptions, req: Request): Promise<ISession> {
  const deviceFingerprint = generateDeviceFingerprint(req);
  const geoLocation = await getGeoLocation(options.ipAddress);
  
  // Check for concurrent sessions and clean up if needed
  await enforceConcurrentSessionLimit(options.userId, options.maxConcurrentSessions || 5);
  
  const session = new SessionModel({
    userId: options.userId,
    refreshTokenId: options.refreshTokenId,
    userAgent: options.userAgent,
    deviceFingerprint,
    lastActivity: new Date(),
    geoLocation,
    maxConcurrentSessions: options.maxConcurrentSessions || 5,
    sessionType: options.sessionType || 'web',
    loginAttempts: 0,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return await session.save();
}

/**
 * Enforce concurrent session limit
 */
export async function enforceConcurrentSessionLimit(userId: string, maxSessions: number): Promise<void> {
  const activeSessions = await SessionModel.find({
    userId,
    invalidatedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActivity: -1 });

  if (activeSessions.length >= maxSessions) {
    // Invalidate oldest sessions
    const sessionsToInvalidate = activeSessions.slice(maxSessions - 1);
    const sessionIds = sessionsToInvalidate.map((s: ISession) => s._id);
    
    await SessionModel.updateMany(
      { _id: { $in: sessionIds } },
      { invalidatedAt: new Date() }
    );
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  await SessionModel.updateOne(
    { refreshTokenId: sessionId },
    { 
      lastActivity: new Date(),
      $inc: { loginAttempts: 0 } // Reset login attempts on successful activity
    }
  );
}

/**
 * Get active sessions for user
 */
export async function getUserActiveSessions(userId: string): Promise<ISession[]> {
  return await SessionModel.find({
    userId,
    invalidatedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActivity: -1 });
}

/**
 * Invalidate all user sessions except current
 */
export async function invalidateAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  const query: any = {
    userId,
    invalidatedAt: null
  };

  if (exceptSessionId) {
    query.refreshTokenId = { $ne: exceptSessionId };
  }

  await SessionModel.updateMany(query, { invalidatedAt: new Date() });
}

/**
 * Clean up expired and invalidated sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  await SessionModel.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { invalidatedAt: { $lt: thirtyDaysAgo } }
    ]
  });
}