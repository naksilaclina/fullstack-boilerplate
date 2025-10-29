import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

/**
 * GET /admin/dashboard
 * Admin dashboard endpoint
 */
export default async function dashboard(req: Request, res: Response) {
  res.status(StatusCodes.OK).json({
    message: "Admin Dashboard",
    data: {
      usersCount: 0,
      recentActivities: []
    }
  });
}