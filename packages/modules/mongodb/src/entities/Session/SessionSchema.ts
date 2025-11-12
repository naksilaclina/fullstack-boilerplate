import { Schema } from "mongoose";

const SessionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    refreshTokenId: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: {
      type: String,
    },
    // Enhanced security fields
    deviceFingerprint: {
      type: String,
      required: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    geoLocation: {
      country: {
        type: String,
        default: null,
      },
      city: {
        type: String,
        default: null,
      },
      ip: {
        type: String,
        required: true,
      },
    },
    // Session management
    maxConcurrentSessions: {
      type: Number,
      default: 5,
    },
    sessionType: {
      type: String,
      enum: ["web", "mobile", "api"],
      default: "web",
    },
    // Security tracking
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lastLoginAttempt: {
      type: Date,
      default: null,
    },
    // Original fields
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index to automatically remove expired sessions
    },
    invalidatedAt: {
      type: Date,
      default: null,
      index: true,
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add indexes for common queries
SessionSchema.index({ userId: 1 });
SessionSchema.index({ refreshTokenId: 1 });
SessionSchema.index({ deviceFingerprint: 1 });
SessionSchema.index({ userId: 1, deviceFingerprint: 1 });
SessionSchema.index({ lastActivity: 1 });

// Compound index for concurrent session management
SessionSchema.index({ userId: 1, invalidatedAt: 1, expiresAt: 1 });

export default SessionSchema;