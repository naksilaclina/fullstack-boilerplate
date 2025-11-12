import type { Request, Response, NextFunction } from "express";

import { type IRoute, type IFlowResults } from "./types";

export const createRouteAction = <
  ParamsType,
  ResponseType extends IFlowResults
>(
  route: IRoute<ParamsType, ResponseType>
) => [
  ...route.params.middleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = route.params.getParams(req);

      const resultsOrPromise = route.flow(params);

      const results =
        resultsOrPromise instanceof Promise
          ? await resultsOrPromise
          : resultsOrPromise;

      res.status(results.status).json(results.body ?? {});
    } catch (error) {
      next(error);
    }
  },
];
