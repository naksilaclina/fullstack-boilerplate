import { Router } from "express";

import createUser from "./createUser";
import getUser from "./getUser";
import getUsers from "./getUsers";

const router = Router();

// GET /api/v1/users
router.use("/", getUsers);

// GET /api/v1/users/:id
router.use("/:id", getUser);

// POST /api/v1/users
router.use("/", createUser);

export default router;