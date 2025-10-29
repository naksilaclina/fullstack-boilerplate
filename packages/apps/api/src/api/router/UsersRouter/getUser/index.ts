import { createRouteAction } from "../../utils";

import { flow } from "./flow";
import { params, type IGetUserParams } from "./params";
import { type GetUserActionResults } from "./response";

export default createRouteAction<
  IGetUserParams,
  GetUserActionResults
>({ flow, params });