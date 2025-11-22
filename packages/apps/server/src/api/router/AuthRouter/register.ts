import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { hash } from "bcrypt";
import { UserModel } from "@naksilaclina/mongodb";
import { generateAccessToken, generateRefreshToken, createEnhancedSession, getClientIP, AUTH_CONSTANTS } from "~api/services/auth";
import { validateEmail, validatePassword, validateName, handleValidationErrors } from "~api/utils/validation.utils";
import { authRateLimiter } from "~api/middlewares";
import { v4 as uuidv4 } from "uuid";
import { isDevelopment, isProduction } from "../../../config";

const router = Router();
const SALT_ROUNDS = 10;

// Helper function for conditional logging
const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

// Additional validation for new fields
const validatePhone = () => {
  return body("phone")
    .optional()
    .isString()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please provide a valid phone number");
};

const validateDateOfBirth = () => {
  return body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date of birth")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      if (age < 13) {
        throw new Error("You must be at least 13 years old to register");
      }
      if (age > 120) {
        throw new Error("Please provide a valid date of birth");
      }
      return true;
    });
};

const validateGender = () => {
  return body("gender")
    .optional()
    .isIn(["male", "female", "other", "prefer-not-to-say"])
    .withMessage("Please select a valid gender option");
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
    validatePhone(),
    validateDateOfBirth(),
    validateGender(),
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

      const {
        firstName,
        lastName,
        email,
        password,
        phone,
        dateOfBirth,
        gender,
        bio
      } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          error: "User with this email already exists",
        });
      }

      // Hash the password
      const hashedPassword = await hash(password, SALT_ROUNDS);

      // Create the user with additional profile information
      const user = new UserModel({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "user", // Default role
        phone,
        dateOfBirth,
        gender,
        bio,
        emailVerified: false, // Email verification required
        preferences: {
          newsletter: false,
          notifications: {
            email: true,
            push: true
          },
          theme: "auto",
          language: "en"
        },
        timezone: "UTC",
        locale: "en-US"
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
        maxConcurrentSessions: AUTH_CONSTANTS.MAX_CONCURRENT_SESSIONS
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
        maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
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
          phone: savedUser.phone,
          dateOfBirth: savedUser.dateOfBirth,
          gender: savedUser.gender,
          bio: savedUser.bio
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