import { Router } from "express";

import { authenticate } from "~api/middlewares/auth";
import { authorize, UserRole } from "~api/middlewares/auth/authorization.middleware";

import admin from "./admin";
import users from "./users";

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticate);

// Apply authorization middleware to ensure only admins can access
router.use(authorize(UserRole.ADMIN));

// GET /api/v1/admin/dashboard
router.get("/dashboard", admin);

// GET /api/v1/admin/users
router.get("/users", users);
router.get("/users/:id", users);
router.post("/users", users);
router.put("/users/:id", users);
router.delete("/users/:id", users);

export default router;