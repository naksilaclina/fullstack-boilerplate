import jwt from "jsonwebtoken";
import { SessionModel } from "@naksilaclina/mongodb";
import { jwtSecret, jwtRefreshSecret } from "../../../config";
import { isDevelopment } from "~config";

// Validate that secrets are properly configured
const JWT_SECRET = jwtSecret || (isDevelopment ? 'dev-jwt-secret-change-in-production-32chars' : '');
const JWT_REFRESH_SECRET = jwtRefreshSecret || (isDevelopment ? 'dev-jwt-refresh-secret-change-in-production-32chars' : '');

if (!JWT_SECRET) {
  const errorMessage = "JWT_SECRET is not configured. Please set it in your environment variables.";
  console.error(errorMessage);
  throw new Error(errorMessage);
}

if (!JWT_REFRESH_SECRET) {
  const errorMessage = "JWT_REFRESH_SECRET is not configured. Please set it in your environment variables.";
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string; // Optional for backward compatibility
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m", // Short-lived access token
    issuer: "naksilaclina",
    audience: "naksilaclina-users",
  });
}

/**
 * Generate refresh token
 */
export async function generateRefreshToken(userId: string, sessionId?: string): Promise<string> {
  // Use the provided session ID as jti, or generate a random one if not provided
  const jti = sessionId || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const token = jwt.sign({ userId, jti }, JWT_REFRESH_SECRET, {
    expiresIn: "7d", // Longer-lived refresh token
    issuer: "naksilaclina",
    audience: "naksilaclina-users",
  });
  
  return token;
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "naksilaclina",
      audience: "naksilaclina-users",
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<(JwtPayload & { jti: string }) | null> {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "naksilaclina",
      audience: "naksilaclina-users",
    });
    
    // Type guard to ensure decoded is a JwtPayload with jti
    if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded) || !('jti' in decoded)) {
      return null;
    }
    
    const payload = decoded as JwtPayload & { jti: string };
    
    // Enhanced session validation with retry logic for refresh token rotation
    let session = await SessionModel.findOne({ 
      refreshTokenId: payload.jti,
      userId: payload.userId,
      expiresAt: { $gt: new Date() }
    });
    
    // If session doesn't exist, wait a short time and try again (handles refresh token rotation)
    if (!session) {
      // Wait 100ms and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      session = await SessionModel.findOne({ 
        refreshTokenId: payload.jti,
        userId: payload.userId,
        expiresAt: { $gt: new Date() }
      });
    }
    
    // If session still doesn't exist, is invalidated, or expired
    if (!session || session.invalidatedAt) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Invalidate a refresh token (for rotation)
 */
export async function invalidateRefreshToken(jti: string): Promise<void> {
  // Mark the session as invalidated in the database
  await SessionModel.updateOne(
    { refreshTokenId: jti },
    { invalidatedAt: new Date() }
  );
}

/**
 * Clean up expired invalidated tokens (handled by MongoDB TTL index)
 */
export function cleanupInvalidTokens(): void {
  // No need to implement cleanup as MongoDB TTL index handles this automatically
  // The expiresAt field has a TTL index that automatically removes expired sessions
}