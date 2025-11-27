import { UserModel } from "@naksilaclina/mongodb";
import { hash } from "bcrypt";

import { type RouteFlowType } from "~api/router/utils";
// Import validation utilities
import { validatePassword } from "~api/utils/validation.utils";
import { isDevelopment } from "~config";

import { type ICreateUserParams } from "./params";
import {
  documentToRecord,
  type CreateUserActionResults,
} from "./response";

const SALT_ROUNDS = 10;

export const flow: RouteFlowType<
  ICreateUserParams,
  CreateUserActionResults
> = async ({ firstName, lastName, email, password, role }) => {
  // Validate password strength
  const errors: string[] = [];
  
  if (isDevelopment) {
    // In development mode, only require minimum length of 6 characters
    if (password.length < 6 || password.length > 128) {
      errors.push("Password must be between 6 and 128 characters");
    }
  } else {
    // In production mode, require strong password
    if (password.length < 8 || password.length > 128) {
      errors.push("Password must be between 8 and 128 characters");
    }
    
    // Check for required character types
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      errors.push("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
    }
  }
  
  if (errors.length > 0) {
    // Return error response with proper structure
    return {
      status: 400,
      body: {
        error: "Validation failed",
        details: errors.map(message => ({
          field: "password",
          message
        }))
      } as any
    };
  }

  // Check if user already exists
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return {
      status: 409,
      body: {
        error: "User with this email already exists"
      } as any
    };
  }

  // Hash the password
  const hashedPassword = await hash(password, SALT_ROUNDS);

  // Create the user
  const user = new UserModel({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role: role || "user",
  });

  // Save the user
  const savedUser = await user.save();

  return {
    status: 201,
    body: documentToRecord(savedUser as any),
  };
};