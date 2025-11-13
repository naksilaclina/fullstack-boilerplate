import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import csrf from "csurf";
import { config } from "../../config";

/**
 * Advanced OWASP Security Headers Configuration
 */
const advancedHelmetConfig = {
  // Content Security Policy - Prevents XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        // 'unsafe-inline' removed for enhanced security - only kept for development
        ...(config.nodeEnv === 'development' ? ["'unsafe-inline'"] : []),
        "https://fonts.googleapis.com"
      ],
      scriptSrc: ["'self'"], // 'unsafe-inline' removed for enhanced security
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:" // For uploaded images
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        // Add your API domains here
        ...(config.nodeEnv === 'development' ? ['http://localhost:*'] : [])
      ],
      frameSrc: ["'none'"], // Prevent embedding in frames
      objectSrc: ["'none'"], // Prevent object/embed/applet
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      ...(config.nodeEnv === 'production' && { upgradeInsecureRequests: [] })
    },
    reportOnly: config.security.csp.reportOnly,
    reportUri: config.security.csp.reportUri
  },

  // HTTP Strict Transport Security - Forces HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options - Prevents clickjacking
  frameguard: {
    action: 'deny' as const
  },

  // X-Content-Type-Options - Prevents MIME sniffing
  noSniff: true,

  // Referrer Policy - Controls referrer information
  referrerPolicy: {
    policy: 'no-referrer' as const
  },

  // X-XSS-Protection - Legacy XSS protection (deprecated but still useful)
  xssFilter: true,

  // X-DNS-Prefetch-Control - Controls DNS prefetching
  dnsPrefetchControl: {
    allow: false
  },

  // X-Download-Options - Prevents IE from executing downloads
  ieNoOpen: true,

  // X-Permitted-Cross-Domain-Policies - Controls Flash/PDF cross-domain
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none' as const
  },

  // Hide X-Powered-By header
  hidePoweredBy: true
};

/**
 * Security middleware to apply various security headers and protections
 */
export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  // Apply advanced helmet middleware for comprehensive security headers
  helmet(advancedHelmetConfig)(req, res, () => {

    // Additional modern security headers
    res.setHeader("Permissions-Policy", [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "speaker=()",
      "fullscreen=(self)",
      "sync-xhr=()"
    ].join(", "));

    // Cross-Origin Embedder Policy
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

    // Cross-Origin Opener Policy
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

    // Cross-Origin Resource Policy
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

    // Server information hiding
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");

    next();
  });
}

/**
 * Rate limiter for authentication endpoints to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: config.security.rateLimiting.windowMs,
  max: config.security.rateLimiting.authMaxRequests,
  message: {
    error: "Too many login attempts, please try again later."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for general API endpoints
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.security.rateLimiting.windowMs,
  max: config.security.rateLimiting.maxRequests,
  message: {
    error: "Too many requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});