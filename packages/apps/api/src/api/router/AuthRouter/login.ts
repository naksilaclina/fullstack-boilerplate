import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { compare } from "bcrypt";
import { UserModel, SessionModel, type IUserDocument } from "@naksilaclina/mongodb";
import { signAccessToken, signRefreshToken } from "~api/services/auth/jwt.utils";
import { validateEmail, validatePassword, handleValidationErrors } from "~api/utils/validation.utils";
import { authRateLimiter } from "~api/middlewares";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Helper function to get client IP address
const getClientIP = (req: Request): string => {
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
};

// Helper function for conditional logging
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

/**
 * POST /api/v1/auth/login
 * Login endpoint
 */
router.post(
  "/",
  authRateLimiter,
  [
    validateEmail(),
    validatePassword(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      devLog("Login attempt started", { 
        email: req.body.email,
        timestamp: new Date().toISOString()
      });

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        devLog("Validation failed", { 
          errors: errors.array(),
          email: req.body.email
        });
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { email, password } = req.body;
      devLog("Validation passed", { email });

      // Find user by email
      const user = await UserModel.findOne({ email });
      if (!user) {
        devLog("User not found", { email });
        return res.status(401).json({
          error: "Invalid credentials",
        });
      }

      devLog("User found", { email, userId: user._id, isActive: user.isActive });

      // Check if account is active
      if (!user.isActive) {
        devLog("Account is deactivated", { email, userId: user._id });
        return res.status(401).json({
          error: "Account is deactivated",
        });
      }

      // Validate password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        devLog("Invalid password", { email, userId: user._id });
        return res.status(401).json({
          error: "Invalid credentials",
        });
      }

      devLog("Password is valid", { email, userId: user._id });

      // Generate tokens
      devLog("Generating access token", { email, userId: user._id });
      const accessToken = signAccessToken(user as IUserDocument);
      
      devLog("Generating refresh token", { email, userId: user._id });
      const refreshToken = signRefreshToken(user as IUserDocument);

      // Create session record
      const sessionId = uuidv4();
      const clientIP = getClientIP(req);
      
      const session = new SessionModel({
        userId: user._id.toString(),
        refreshTokenId: sessionId,
        userAgent: req.get("User-Agent"),
        ipAddr: clientIP,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      
      await session.save();
      devLog("Session created", { sessionId, userId: user._id, clientIP });

      // Set refresh token in HTTP-only cookie
      devLog("Setting refresh token cookie", { email, userId: user._id });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // Set access token in HTTP-only cookie for enhanced security
      devLog("Setting access token cookie", { email, userId: user._id });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: "/",
      });

      // Return user data (without tokens, as they're in cookies now)
      devLog("Login successful", { 
        email: user.email,
        userId: user._id,
        role: user.role
      });
      
      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Login error:", error);
      }
      return res.status(500).json({
        error: "Internal server error during login",
      });
    }
  }
);

export default router;