import { Router } from "express";

import { isDevelopment } from "../../config";

import UsersRouter from "./UsersRouter";
import AdminRouter from "./AdminRouter";
import AuthRouter from "./AuthRouter";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/users", UsersRouter);
router.use("/admin", AdminRouter);

if (isDevelopment) {
  router.get("/error", () => {
    throw new Error("Testing error handling in development mode");
  });
}

export default router;