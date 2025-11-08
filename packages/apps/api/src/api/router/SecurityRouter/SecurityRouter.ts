import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";

const SecurityRouter = Router();

/**
 * CSP Report Endpoint
 * Receives Content Security Policy violation reports
 */
SecurityRouter.post("/csp-report", 
  // Validation middleware
  [
    body('csp-report').isObject().withMessage('CSP report must be an object'),
    body('csp-report.document-uri').optional().isURL().withMessage('Invalid document URI'),
    body('csp-report.violated-directive').optional().isString().withMessage('Violated directive must be a string'),
    body('csp-report.blocked-uri').optional().isString().withMessage('Blocked URI must be a string')
  ],
  (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid CSP report format',
        details: errors.array()
      });
    }

    const cspReport = req.body['csp-report'];
    
    // Log CSP violation for monitoring
    console.warn('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      documentUri: cspReport['document-uri'],
      violatedDirective: cspReport['violated-directive'],
      blockedUri: cspReport['blocked-uri'],
      originalPolicy: cspReport['original-policy'],
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      referrer: req.get('Referer')
    });

    // In production, you might want to:
    // 1. Store violations in database for analysis
    // 2. Send alerts for critical violations
    // 3. Aggregate violation statistics
    
    // Respond with 204 No Content (standard for CSP reports)
    res.status(204).send();
  }
);

/**
 * Security Headers Test Endpoint
 * Allows testing of security headers implementation
 */
SecurityRouter.get("/headers-test", (req: Request, res: Response) => {
  res.json({
    message: "Security headers test endpoint",
    timestamp: new Date().toISOString(),
    headers: {
      'content-security-policy': res.getHeader('content-security-policy'),
      'strict-transport-security': res.getHeader('strict-transport-security'),
      'x-frame-options': res.getHeader('x-frame-options'),
      'x-content-type-options': res.getHeader('x-content-type-options'),
      'referrer-policy': res.getHeader('referrer-policy'),
      'permissions-policy': res.getHeader('permissions-policy')
    }
  });
});

/**
 * Security Health Check
 * Provides security-related system status
 */
import { config } from "../../../config";

SecurityRouter.get("/health", (req: Request, res: Response) => {
  const securityStatus = {
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    security: {
      https: req.secure || req.get('x-forwarded-proto') === 'https',
      headers: {
        csp: !!res.getHeader('content-security-policy'),
        hsts: !!res.getHeader('strict-transport-security'),
        frameOptions: !!res.getHeader('x-frame-options'),
        contentTypeOptions: !!res.getHeader('x-content-type-options')
      },
      rateLimiting: true, // Assuming rate limiting is active
      cors: config.security.corsOrigins.length > 0
    }
  };

  res.json(securityStatus);
});

export default SecurityRouter;