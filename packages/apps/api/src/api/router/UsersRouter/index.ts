import { Router } from "express";

import getUsers from "./getUsers";
import getUser from "./getUser";
import createUser from "./createUser";

const router = Router();

// GET /api/v1/users
router.get("/", getUsers);

// GET /api/v1/users/:id
router.get("/:id", getUser);

// POST /api/v1/users
router.post("/", createUser);

export default router;