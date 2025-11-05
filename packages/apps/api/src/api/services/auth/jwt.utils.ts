import jwt from "jsonwebtoken";
import { IUserDocument, SessionModel } from "@naksilaclina/mongodb";
import { jwtSecret, jwtRefreshSecret } from "~config";
import crypto from "crypto";

// Validate that secrets are properly configured
const JWT_SECRET = jwtSecret as string;
const JWT_REFRESH_SECRET = jwtRefreshSecret as string;

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
}

/**
 * Sign an access token JWT
 */
export function signAccessToken(user: IUserDocument): string {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
    issuer: "naksilaclina",
    audience: "naksilaclina-users",
  });
}

/**
 * Sign a refresh token JWT
 */
export function signRefreshToken(user: IUserDocument): string {
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
 * Verify a refresh token JWT
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
    
    // Check if token has been invalidated (rotation) by looking in the database
    const session = await SessionModel.findOne({ 
      refreshTokenId: payload.jti,
      invalidatedAt: { $ne: null }
    });
    
    // If we found an invalidated session, the token is invalid
    if (session) {
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