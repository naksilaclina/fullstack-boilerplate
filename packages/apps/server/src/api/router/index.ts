import { Router } from "express";

import { isDevelopment } from "../../config";

import UsersRouter from "./UsersRouter";
import AdminRouter from "./AdminRouter";
import AuthRouter from "./AuthRouter";
import SessionRouter from "./SessionRouter/SessionRouter";
import SecurityRouter from "./SecurityRouter";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/sessions", SessionRouter);
router.use("/users", UsersRouter);
router.use("/admin", AdminRouter);
router.use("/security", SecurityRouter);

// Health check endpoint
router.get("/ping", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "API is running"
  });
});

if (isDevelopment) {
  router.get("/error", () => {
    throw new Error("Testing error handling in development mode");
  });
}

export default router;