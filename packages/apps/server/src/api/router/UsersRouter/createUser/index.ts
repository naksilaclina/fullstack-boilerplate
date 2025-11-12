import { createRouteAction } from "../../utils";

import { flow } from "./flow";
import { params, type ICreateUserParams } from "./params";
import { type CreateUserActionResults } from "./response";

export default createRouteAction<
  ICreateUserParams,
  CreateUserActionResults
>({ flow, params });