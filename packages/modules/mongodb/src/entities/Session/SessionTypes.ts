import { Document } from "mongoose";

export interface IGeoLocation {
  country?: string;
  city?: string;
  ip: string;
}

export interface ISession extends Document {
  userId: string;
  refreshTokenId: string;
  userAgent?: string;
  // Enhanced security fields
  deviceFingerprint: string;
  lastActivity: Date;
  geoLocation: IGeoLocation;
  maxConcurrentSessions: number;
  sessionType: "web" | "mobile" | "api";
  loginAttempts: number;
  lastLoginAttempt?: Date | null;
  // Original fields
  expiresAt: Date;
  invalidatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionDocument extends ISession {
  _id: string;
}