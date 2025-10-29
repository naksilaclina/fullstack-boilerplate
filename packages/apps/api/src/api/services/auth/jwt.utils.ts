import jwt from "jsonwebtoken";
import { IUserDocument } from "@naksilaclina/mongodb";
import { jwtSecret, jwtRefreshSecret } from "~config";
import crypto from "crypto";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// For refresh token rotation, we'll store used tokens for a short period
// In production, this should be stored in a database or cache
const invalidRefreshTokens = new Set<string>();

/**
 * Sign an access token JWT
 */
export function signAccessToken(user: IUserDocument): string {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, jwtSecret, {
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
    jwtRefreshSecret,
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
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: "naksilaclina",
      audience: "naksilaclina-users",
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a refresh token JWT
 */
export function verifyRefreshToken(token: string): (JwtPayload & { jti: string }) | null {
  try {
    const decoded = jwt.verify(token, jwtRefreshSecret, {
      issuer: "naksilaclina",
      audience: "naksilaclina-users",
    }) as JwtPayload & { jti: string };
    
    // Check if token has been invalidated (rotation)
    if (invalidRefreshTokens.has(decoded.jti)) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Invalidate a refresh token (for rotation)
 */
export function invalidateRefreshToken(jti: string): void {
  invalidRefreshTokens.add(jti);
  
  // Optional: Clean up old invalidated tokens periodically
  // In production, you'd want to store these in a database with expiration
}

/**
 * Clean up expired invalidated tokens (for production use)
 */
export function cleanupInvalidTokens(): void {
  // In a production environment, this would clean up expired tokens from database
  // For now, we'll just clear the set periodically
  if (invalidRefreshTokens.size > 10000) {
    // Simple cleanup to prevent memory issues
    invalidRefreshTokens.clear();
  }
}