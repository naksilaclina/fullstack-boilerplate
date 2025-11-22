import { Router, Request, Response } from "express";
import { validationResult } from "express-validator";
import { compare } from "bcrypt";
import { UserModel } from "@naksilaclina/mongodb";
import { generateAccessToken, generateRefreshToken, createEnhancedSession, getClientIP, AUTH_CONSTANTS } from "~api/services/auth";
import { validateEmail, validatePassword, handleValidationErrors } from "~api/utils/validation.utils";
import { authRateLimiter } from "~api/middlewares";
import { v4 as uuidv4 } from "uuid";
import { isDevelopment, isProduction } from "../../../config";

const router = Router();

// Helper function for conditional logging - reduced verbosity
const devLog = (message: string, data?: any) => {
  if (isDevelopment) {
    // Only log important events, not every step
    if (message.includes('Login attempt started') ||
      message.includes('Login successful') ||
      message.includes('User not found') ||
      message.includes('Invalid password') ||
      message.includes('Account is deactivated')) {
      console.log(message, data);
    }
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

      // Find user by email
      const user = await UserModel.findOne({ email });
      if (!user) {
        devLog("User not found", { email });
        return res.status(401).json({
          error: "Invalid credentials",
        });
      }

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

      // Create enhanced session record first
      const sessionId = uuidv4();
      const clientIP = getClientIP(req);

      const session = await createEnhancedSession({
        userId: user._id.toString(),
        refreshTokenId: sessionId,
        ipAddress: clientIP,
        userAgent: req.get("User-Agent"),
        sessionType: 'web',
        maxConcurrentSessions: AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS
      }, req);

      // Generate tokens with session ID
      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId: sessionId
      });

      const refreshToken = await generateRefreshToken(user._id.toString(), sessionId);

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax", // Changed from "strict" to "lax" to allow refresh token to be sent on page refresh
        maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
        path: "/",
      });

      // Set access token in HTTP-only cookie for enhanced security
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax", // Changed from "strict" to "lax" to allow access token to be sent on page refresh
        maxAge: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
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
      if (isDevelopment) {
        console.error("Login error:", error);
      }
      return res.status(500).json({
        error: "Internal server error during login",
      });
    }
  }
);

export default router;