import { useRequestParams } from "~api/services/validations";

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
    isLength: {
      options: { min: 6 },
      errorMessage: "Password must be at least 6 characters long",
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