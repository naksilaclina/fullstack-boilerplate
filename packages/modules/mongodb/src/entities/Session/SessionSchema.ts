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
    ipAddr: {
      type: String,
      required: true, // Make IP address required for security purposes
    },
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

export default SessionSchema;