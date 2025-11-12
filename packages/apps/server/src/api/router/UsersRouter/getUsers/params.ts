import { useRequestParams } from "~api/services";

export interface IGetUsersParams {
  page: number;
}

export const params = useRequestParams<IGetUsersParams>({
  page: {
    in: "query",
    isInt: { 
      options: { min: 1 },
      errorMessage: "Page must be a positive integer"
    },
    optional: { options: { nullable: true } }
  },
});