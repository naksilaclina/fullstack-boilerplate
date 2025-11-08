import jwt from "jsonwebtoken";
import { IUserDocument, SessionModel } from "@naksilaclina/mongodb";
import { jwtSecret, jwtRefreshSecret } from "~config";
import crypto from "crypto";

// Validate that secrets are properly configured
const JWT_SECRET = jwtSecret || (process.env.NODE_ENV === 'development' ? 'dev-jwt-secret-change-in-production-32chars' : '');
const JWT_REFRESH_SECRET = jwtRefreshSecret || (process.env.NODE_ENV === 'development' ? 'dev-jwt-refresh-secret-change-in-production-32chars' : '');

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
 * Sign an access token JWT
 */
export function signAccessToken(user: IUserDocument): string;
export function signAccessToken(payload: { userId: string; email?: string; role?: string; sessionId?: string }): string;
export function signAccessToken(userOrPayload: IUserDocument | { userId: string; email?: string; role?: string; sessionId?: string }): string {
  let payload: JwtPayload;
  
  // Check if it's an IUserDocument (has _id property)
  if ('_id' in userOrPayload) {
    const user = userOrPayload as IUserDocument;
    payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  } else {
    // It's a plain object with sessionId
    const customPayload = userOrPayload as { userId: string; email?: string; role?: string; sessionId?: string };
    payload = {
      userId: customPayload.userId,
      email: customPayload.email || '',
      role: customPayload.role || 'user',
      sessionId: customPayload.sessionId,
    };
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
    issuer: "naksilaclina",
    audience: "naksilaclina-users",
  });
}

/**
 * Sign a refresh token JWT
 */
export function signRefreshToken(user: IUserDocument): string;
export function signRefreshToken(user: { _id: any; email: string; role: string }): string;
export function signRefreshToken(user: IUserDocument | { _id: any; email: string; role: string }): string {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  // Add a random jti (JWT ID) for refresh token rotation
  const jti = crypto.randomBytes(16).toString("hex");
  
  return jwt.sign(
    {
      ...payload,
      jti,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
      issuer: "naksilaclina",
      audience: "naksilaclina-users",
    }
  );
}

/**
 * Verify an access token JWT
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "naksilaclina",
      audience: "naksilaclina-users",
    });
    
    // Type guard to ensure decoded is a JwtPayload
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return decoded as JwtPayload;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a refresh token JWT with enhanced security checks
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
    
    // Enhanced session validation
    const session = await SessionModel.findOne({ 
      refreshTokenId: payload.jti,
      userId: payload.userId,
      expiresAt: { $gt: new Date() }
    });
    
    // If session doesn't exist, is invalidated, or expired
    if (!session || session.invalidatedAt) {
      return null;
    }

    // Check for suspicious activity
    if (session.suspiciousActivity) {
      console.warn('[SECURITY] Refresh token used for suspicious session:', {
        userId: payload.userId,
        sessionId: payload.jti,
        timestamp: new Date().toISOString()
      });
      // Still allow refresh but log the event
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