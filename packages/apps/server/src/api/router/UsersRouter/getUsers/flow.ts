import { UserModel } from "@naksilaclina/mongodb";

import { getSkipForPagination } from "~api/utils";
import { type RouteFlowType } from "~api/router/utils";

import { type IGetUsersParams } from "./params";
import {
  documentToRecord,
  type GetUsersActionResults,
} from "./response";

const LIMIT_PER_PAGE = 10;
const FIELDS_TO_SELECT = [
  "_id",
  "firstName",
  "lastName",
  "email",
  "isActive",
  "role",
];

export const flow: RouteFlowType<
  IGetUsersParams,
  GetUsersActionResults
> = async ({ page }) => {
  const limit = LIMIT_PER_PAGE;
  const skip = getSkipForPagination(page, limit);

  const createUsersQuery = <T>() =>
    UserModel.aggregate<T>([
      {
        $project: {
          ...FIELDS_TO_SELECT.reduce((acc: Record<string, 1>, field) => {
            acc[field] = 1;

            return acc;
          }, {}),
        },
      },
    ]);

  const totalRecords = await createUsersQuery<{ count: number }>()
    .count("count")
    .exec()
    .then((res: Array<{count: number}>) => {
      return res.length && res[0].count;
    });

  const records = await createUsersQuery<any>()
    .skip(skip)
    .limit(limit)
    .exec();

  return {
    status: 200,
    body: {
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      records: records.map(documentToRecord),
    },
  };
};