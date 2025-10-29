import type { ValidationError } from "express-validator";

export default interface IBadRequestErrorResponse {
  message: string;
  errors: ValidationError[];
}
