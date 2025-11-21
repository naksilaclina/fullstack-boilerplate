import { JwtPayload } from "../utils";

// User role enumeration
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

// Authentication response interface
export interface AuthResponse {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    bio?: string;
  };
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Register data interface
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
}

// Session interface
export interface Session {
  id: string;
  createdAt: string;
  userAgent?: string;
  ipAddr?: string;
  expiresAt: string;
}

// Sessions response interface
export interface SessionsResponse {
  message: string;
  sessions: Session[];
}

// JWT Payload extension with session ID
export interface ExtendedJwtPayload extends JwtPayload {
  sessionId?: string;
}