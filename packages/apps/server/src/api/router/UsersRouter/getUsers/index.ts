import { createRouteAction } from "../../utils";

import { flow } from "./flow";
import { params, type IGetUsersParams } from "./params";
import { type GetUsersActionResults } from "./response";

export default createRouteAction<
  IGetUsersParams,
  GetUsersActionResults
>({ flow, params });