import { type Document, type Model, type Types } from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive: boolean;
  role: "user" | "admin";
  
  // Profile information
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  dateOfBirth?: Date | null;
  gender?: "male" | "female" | "other" | "prefer-not-to-say" | null;
  
  // Address information
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
  } | null;
  
  // Account management
  lastLoginAt?: Date | null;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  
  // Security fields
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  
  // Preferences
  preferences?: {
    newsletter: boolean;
    notifications?: {
      email: boolean;
      push: boolean;
    } | null;
    theme: "light" | "dark" | "auto" | null;
    language: string | null;
  } | null;
  
  // Metadata
  timezone?: string | null;
  locale?: string | null;
}

// Simplified interface for Mongoose documents with timestamps
export interface IUserDocument extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive: boolean;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  dateOfBirth?: Date | null;
  gender?: "male" | "female" | "other" | "prefer-not-to-say" | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
  } | null;
  lastLoginAt?: Date | null;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  preferences?: {
    newsletter: boolean;
    notifications?: {
      email: boolean;
      push: boolean;
    } | null;
    theme: "light" | "dark" | "auto" | null;
    language: string | null;
  } | null;
  timezone?: string | null;
  locale?: string | null;
}

export type IUserModel = Model<IUserDocument>;