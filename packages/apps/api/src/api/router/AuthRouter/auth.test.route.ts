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

export default router;