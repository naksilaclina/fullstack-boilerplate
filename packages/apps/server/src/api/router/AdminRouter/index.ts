import { Router } from "express";

import dashboard from "./dashboard";
import users from "./users";

const router = Router();

// GET /api/v1/admin/dashboard
router.get("/dashboard", dashboard);

// GET /api/v1/admin/users
router.get("/users", users);
router.get("/users/:id", users);
router.post("/users", users);
router.put("/users/:id", users);
router.delete("/users/:id", users);

export default router;