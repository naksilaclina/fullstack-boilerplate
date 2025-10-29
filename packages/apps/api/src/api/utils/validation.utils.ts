import { body, validationResult, ValidationError, ValidationChain } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { isDevelopment } from "~config";

/**
 * Custom validation result handler
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log validation errors for monitoring
    console.warn("Validation failed", {
      errors: errors.array(),
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((error: ValidationError) => ({
        field: error.param,
        message: error.msg,
      })),
    });
  }
  
  next();
}

/**
 * Enhanced email validation with additional security checks
 */
export const validateEmail = (): ValidationChain => {
  return body("email")
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: true,
      outlookdotcom_remove_subaddress: true,
      yahoo_remove_subaddress: true,
    })
    .trim()
    .escape()
    .isLength({ min: 5, max: 254 })
    .withMessage("Please provide a valid email address");
};

/**
 * Enhanced password validation with security requirements
 */
export const validatePassword = (): ValidationChain => {
  if (isDevelopment) {
    // In development mode, only require minimum length of 6 characters
    return body("password")
      .isString()
      .trim()
      .isLength({ min: 6, max: 128 })
      .withMessage("Password must be between 6 and 128 characters");
  }
  
  // In production mode, require strong password
  return body("password")
    .isString()
    .trim()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
};

/**
 * Enhanced name validation
 */
export const validateName = (field: string): ValidationChain => {
  return body(field)
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} must be between 1 and 50 characters`)
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-']+$/)
    .withMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} contains invalid characters`);
};