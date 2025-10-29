import { UserModel } from "@naksilaclina/mongodb";
import { hash } from "bcrypt";

import { type RouteFlowType } from "~api/router/utils";

import { type ICreateUserParams } from "./params";
import {
  documentToRecord,
  type ICreateUserDocument,
  type CreateUserActionResults,
} from "./response";

const SALT_ROUNDS = 10;

export const flow: RouteFlowType<
  ICreateUserParams,
  CreateUserActionResults
> = async ({ firstName, lastName, email, password, role }) => {
  // Hash the password
  const hashedPassword = await hash(password, SALT_ROUNDS);

  // Create the user
  const user = new UserModel({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role: role || "user",
  });

  // Save the user
  const savedUser = await user.save();

  return {
    status: 201,
    body: documentToRecord(savedUser as ICreateUserDocument),
  };
};