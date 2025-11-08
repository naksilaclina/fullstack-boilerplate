import { Router, Request, Response } from "express";
import { authenticate } from "~api/middlewares";

const router = Router();

/**
 * GET /api/v1/auth/test
 * Test endpoint to verify authentication
 */
router.get("/", authenticate, (req: Request, res: Response) => {
  return res.status(200).json({
    message: "Authentication successful!",
    user: req.user,
  });
});

/**
 * GET /api/v1/auth/test/ping
 * Simple ping endpoint for CORS testing (no auth required)
 */
router.get("/ping", (req: Request, res: Response) => {
  return res.status(200).json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    origin: req.get('Origin') || 'No origin header',
    userAgent: req.get('User-Agent') || 'No user agent'
  });
});

export default router;