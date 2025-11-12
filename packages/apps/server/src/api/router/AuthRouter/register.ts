import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { hash } from "bcrypt";
import { UserModel, type IUserDocument } from "@naksilaclina/mongodb";
import { generateAccessToken, generateRefreshToken, createEnhancedSession } from "~api/services/auth";
import { validateEmail, validatePassword, validateName, handleValidationErrors } from "~api/utils/validation.utils";
import { authRateLimiter } from "~api/middlewares";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const SALT_ROUNDS = 10;

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

import { isDevelopment, isProduction } from "../../../config";

// Helper function for conditional logging
const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * POST /api/v1/auth/register
 * Register endpoint
 */
router.post(
  "/",
  authRateLimiter,
  [
    validateName("firstName"),
    validateName("lastName"),
    validateEmail(),
    validatePassword(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { firstName, lastName, email, password } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          error: "User with this email already exists",
        });
      }

      // Hash the password
      const hashedPassword = await hash(password, SALT_ROUNDS);

      // Create the user
      const user = new UserModel({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "user", // Default role
      });

      // Save the user
      const savedUser = await user.save();

      // Create enhanced session record first
      const sessionId = uuidv4();
      const clientIP = getClientIP(req);
      
      const session = await createEnhancedSession({
        userId: savedUser._id.toString(),
        refreshTokenId: sessionId,
        ipAddress: clientIP,
        userAgent: req.get("User-Agent"),
        sessionType: 'web',
        maxConcurrentSessions: 5
      }, req);

      // Generate tokens with session ID
      const accessToken = generateAccessToken({
        userId: savedUser._id.toString(),
        email: savedUser.email,
        role: savedUser.role,
        sessionId: sessionId
      });
      const refreshToken = await generateRefreshToken(savedUser._id.toString(), sessionId);

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax", // Changed from "strict" to "lax" to allow refresh token to be sent on page refresh
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // Return user data and access token
      return res.status(201).json({
        message: "Registration successful",
        user: {
          id: savedUser._id,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          email: savedUser.email,
          role: savedUser.role,
        },
        accessToken,
      });
    } catch (error) {
      if (isDevelopment) {
        console.error("Registration error:", error);
      }
      return res.status(500).json({
        error: "Internal server error during registration",
      });
    }
  }
);

export default router;