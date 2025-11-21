import { Request } from "express";
import crypto from "crypto";

/**
 * Generate a device fingerprint based on request headers and IP
 * This helps detect suspicious login attempts from new devices
 */
export function generateDeviceFingerprint(req: Request): string {
  // Get client IP
  const ip = getClientIP(req);
  
  // Get user agent
  const userAgent = req.headers['user-agent'] || '';
  
  // Get accept headers
  const accept = req.headers['accept'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  
  // Combine all device identifiers
  const deviceString = `${ip}|${userAgent}|${accept}|${acceptEncoding}|${acceptLanguage}`;
  
  // Create a hash of the device string for privacy
  return crypto.createHash('sha256').update(deviceString).digest('hex');
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
  return req.ip;
}