import { Router } from "express";

import login from "./login";
import register from "./register";
import logout from "./logout";
import refresh from "./refresh";
import profile from "./profile";
import sessions from "./sessions";
import test from "./auth.test.route";

const router = Router();

// Mount the routers with their respective paths
router.use("/login", login);   // Mount login router at /login
router.use("/register", register);
router.use("/logout", logout);
router.use("/refresh", refresh);
router.use("/profile", profile);
router.use("/sessions", sessions);
router.use("/test", test);

export default router;