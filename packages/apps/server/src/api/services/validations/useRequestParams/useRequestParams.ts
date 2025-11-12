import { type Schema } from "express-validator";

import type { IRouteParams } from "~api/router/utils";

import createMiddleware from "./createMiddleware";
import createParamsGetter from "./createParamsGetter";

export function useRequestParams<T>(schema: Schema): IRouteParams<T> {
  return {
    middleware: [createMiddleware(schema)],
    getParams: createParamsGetter<T>(schema),
  };
}
