import { type Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

import type IBadRequestErrorResponse from "./IBadRequestErrorResponse";

export default function badRequestError(
  res: Response,
  errors: IBadRequestErrorResponse["errors"]
) {
  const body: IBadRequestErrorResponse = {
    message: ReasonPhrases.BAD_REQUEST,
    errors,
  };

  return res.status(StatusCodes.BAD_REQUEST).send(body);
}
