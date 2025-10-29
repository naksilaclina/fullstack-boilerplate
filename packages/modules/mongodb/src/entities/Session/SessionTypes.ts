import { Document } from "mongoose";

export interface ISession extends Document {
  userId: string;
  refreshTokenId: string;
  userAgent?: string;
  ipAddr: string; // Make IP address required
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}