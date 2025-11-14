import type { NextFunction, Request, Response } from "express";

import { internalServerError } from "~api/responses/errors";

export default function handleErrorMiddleware(
  error: Error,
  req: Request, // eslint-disable-line @typescript-eslint/no-unused-vars
  res: Response,
  next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  console.error(error);

  return internalServerError(res, error);
}
