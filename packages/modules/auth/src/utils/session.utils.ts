import { createHash } from "crypto";
import { Request } from "express";
import { SessionModel, ISession } from "@naksilaclina/mongodb";
import { AUTH_CONSTANTS } from "../constants";

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
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
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
  return req.ip || 'unknown';
}

/**
 * Generate device fingerprint from request headers
 */
export function generateDeviceFingerprint(req: Request): string {
  const fingerprint: DeviceFingerprint = {
    userAgent: req.get('User-Agent') || '',
    acceptLanguage: req.get('Accept-Language') || '',
    acceptEncoding: req.get('Accept-Encoding') || '',
    // Removed X-Screen-Resolution as it's not a standard header and not sent by frontend
    // Removed Sec-CH-UA-Platform as it requires Client Hints opt-in
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
    country: ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') ? 'Local' : 'Unknown',
    city: ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') ? 'Local' : 'Unknown',
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
  await enforceConcurrentSessionLimit(options.userId, options.maxConcurrentSessions || AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS);

  const session = new SessionModel({
    userId: options.userId,
    refreshTokenId: options.refreshTokenId,
    userAgent: options.userAgent,
    deviceFingerprint,
    lastActivity: new Date(),
    geoLocation,
    maxConcurrentSessions: options.maxConcurrentSessions || AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS,
    sessionType: options.sessionType || 'web',
    loginAttempts: 0,
    expiresAt: new Date(Date.now() + AUTH_CONSTANTS.SESSION_EXPIRY),
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
    // Delete oldest sessions
    const sessionsToDelete = activeSessions.slice(maxSessions - 1);
    const sessionIds = sessionsToDelete.map((s: ISession) => s._id);

    await SessionModel.deleteMany(
      { _id: { $in: sessionIds } }
    );
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  // Use findOneAndUpdate for atomic operation and better performance
  await SessionModel.findOneAndUpdate(
    {
      refreshTokenId: sessionId,
      invalidatedAt: null,
      expiresAt: { $gt: new Date() }
    },
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
    userId
  };

  if (exceptSessionId) {
    query.refreshTokenId = { $ne: exceptSessionId };
  }

  await SessionModel.deleteMany(query);
}

/**
 * Clean up expired and invalidated sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - AUTH_CONSTANTS.SESSION_CLEANUP_THRESHOLD);

  await SessionModel.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { invalidatedAt: { $lt: thirtyDaysAgo } }
    ]
  });
}