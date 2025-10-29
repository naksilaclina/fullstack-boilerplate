import { Router, Request, Response } from "express";
import { UserModel } from "@naksilaclina/mongodb";
import { authenticate } from "~api/middlewares";

const router = Router();

// Helper function for conditional logging
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

/**
 * GET /api/v1/auth/profile
 * Get current user profile
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    // req.user is set by the authenticate middleware
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    // Find user by ID
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Return user data
    return res.status(200).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Profile error:", error);
    }
    return res.status(500).json({
      error: "Internal server error while fetching profile",
    });
  }
});

export default router;