import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

/**
 * GET /admin/users
 * Admin users management endpoint
 */
export default async function users(req: Request, res: Response) {
  res.status(StatusCodes.OK).json({
    message: "Admin Users Management",
    data: {
      users: []
    }
  });
}