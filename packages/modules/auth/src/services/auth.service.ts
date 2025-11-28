import { 
  generateAccessToken, 
  generateRefreshToken, 
  createEnhancedSession, 
  invalidateRefreshToken,
  JwtPayload
} from "../utils";
import { Request } from "express";
import { randomBytes } from "crypto";

/**
 * Generate authentication tokens and create session
 */
export async function generateAuthTokens(
  userId: string,
  email: string,
  role: string,
  req: Request
) {
  // Generate secure session ID
  const sessionId = randomBytes(32).toString('hex');
  
  // Create JWT payload
  const payload: JwtPayload = {
    userId,
    email,
    role,
    sessionId
  };
  
  // Generate tokens
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(userId, sessionId);
  
  // Get client IP
  const clientIP = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
  
  // Create enhanced session
  const session = await createEnhancedSession({
    userId,
    refreshTokenId: sessionId,
    ipAddress: clientIP,
    userAgent: req.headers['user-agent'],
    sessionType: 'web'
  }, req);
  
  return {
    accessToken,
    refreshToken,
    sessionId: session.refreshTokenId
  };
}

/**
 * Refresh authentication tokens
 */
export async function refreshAuthTokens(
  userId: string,
  email: string,
  role: string,
  oldSessionId: string,
  req: Request
) {
  // Invalidate old refresh token
  await invalidateRefreshToken(oldSessionId);
  
  // Generate new secure session ID
  const newSessionId = randomBytes(32).toString('hex');
  
  // Create new JWT payload
  const payload: JwtPayload = {
    userId,
    email,
    role,
    sessionId: newSessionId
  };
  
  // Generate new tokens
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(userId, newSessionId);
  
  // Get client IP
  const clientIP = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
  
  // Create new enhanced session
  const session = await createEnhancedSession({
    userId,
    refreshTokenId: newSessionId,
    ipAddress: clientIP,
    userAgent: req.headers['user-agent'],
    sessionType: 'web'
  }, req);
  
  return {
    accessToken,
    refreshToken,
    sessionId: session.refreshTokenId
  };
}