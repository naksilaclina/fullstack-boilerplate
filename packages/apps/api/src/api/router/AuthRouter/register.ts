import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { hash } from "bcrypt";
import { UserModel, type IUserDocument } from "@naksilaclina/mongodb";
import { signAccessToken, signRefreshToken } from "~api/services/auth/jwt.utils";
import { validateEmail, validatePassword, validateName, handleValidationErrors } from "~api/utils/validation.utils";
import { authRateLimiter } from "~api/middlewares";

const router = Router();
const SALT_ROUNDS = 10;

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

      // Generate tokens
      const accessToken = signAccessToken(savedUser as IUserDocument);
      const refreshToken = signRefreshToken(savedUser as IUserDocument);

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
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