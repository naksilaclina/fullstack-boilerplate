import { UserModel } from "@naksilaclina/mongodb";
import { StatusCodes } from "http-status-codes";

import { type RouteFlowType } from "~api/router/utils";

import { type IGetUserParams } from "./params";
import {
  documentToRecord,
  type IGetUserDocument,
  type GetUserActionResults,
} from "./response";

export const flow: RouteFlowType<
  IGetUserParams,
  GetUserActionResults
> = async ({ id }) => {
  const user = await UserModel.findById(id);

  if (!user) {
    return {
      status: StatusCodes.NOT_FOUND,
      body: {
        error: "User not found",
      } as any,
    };
  }

  return {
    status: StatusCodes.OK,
    body: documentToRecord(user as IGetUserDocument),
  };
};