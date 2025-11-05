import { Document } from "mongoose";

export interface ISession extends Document {
  userId: string;
  refreshTokenId: string;
  userAgent?: string;
  ipAddr: string; // Make IP address required
  expiresAt: Date;
  invalidatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}