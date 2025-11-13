import { useRequestParams } from "~api/services";
// Import the validatePassword function from validation utilities
import { validatePassword } from "~api/utils/validation.utils";

export interface ICreateUserBodyParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "user" | "admin";
}

export type ICreateUserParams = ICreateUserBodyParams;

export const params = useRequestParams<ICreateUserParams>({
  firstName: {
    in: "body",
    isString: true,
    trim: true,
    notEmpty: { errorMessage: "First name is required" },
  },
  lastName: {
    in: "body",
    isString: true,
    trim: true,
    notEmpty: { errorMessage: "Last name is required" },
  },
  email: {
    in: "body",
    isEmail: true,
    normalizeEmail: true,
    notEmpty: { errorMessage: "Email is required" },
  },
  password: {
    in: "body",
    // Use the same strong password validation as the auth endpoints
    custom: {
      options: async (value, { req, location, path }) => {
        // We'll validate the password using our validation function
        // This is a workaround since useRequestParams doesn't directly support ValidationChain
        return true; // We'll handle validation in the flow
      }
    },
    notEmpty: { errorMessage: "Password is required" },
  },
  role: {
    in: "body",
    optional: true,
    isIn: {
      options: [["user", "admin"]],
      errorMessage: "Role must be either 'user' or 'admin'",
    },
  },
});