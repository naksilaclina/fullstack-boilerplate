import { type Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

import { isDevelopment } from "~api-root/config";

import type IInternalServerErrorResponse from "./IInternalServerErrorResponse";

export default function internalServerError(res: Response, error: Error) {
  const status = StatusCodes.INTERNAL_SERVER_ERROR;
  const body: IInternalServerErrorResponse = {
    message: ReasonPhrases.INTERNAL_SERVER_ERROR,
  };

  if (isDevelopment) {
    body.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return res.status(status).send(body);
}
