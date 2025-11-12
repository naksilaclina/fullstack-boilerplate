import { type Request } from "express";
import { type Schema } from "express-validator";

import type { GetParamsType } from "~api/router/utils/createRouteAction";

type ParamType = string | number | boolean | object;
type ParamsType = Record<string, ParamType | ParamType[]>;

export default function createParamsGetter<T>(
  schema: Schema
): GetParamsType<T> {
  return (req: Request): T => {
    const params: ParamsType = {};

    for (const [key, value] of Object.entries(schema)) {
      if (Array.isArray(value.in)) {
        throw new Error(
          `Cannot get params from request for schema with multiple locations.`
        );
      }

      params[key] =
        value.in !== undefined
          ? (req[value.in] as ParamsType)[key]
          : // @ts-expect-error this is a hack to get around the fact that the type of req[key] is unknown
            (req[key] as ParamType);
    }

    return params as T;
  };
}
