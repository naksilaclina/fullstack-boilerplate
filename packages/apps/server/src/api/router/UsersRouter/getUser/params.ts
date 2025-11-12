import { useRequestParams } from "~api/services";

export interface IGetUserParams {
  id: string;
}

export const params = useRequestParams<IGetUserParams>({
  id: {
    in: "params",
    isMongoId: true,
    notEmpty: { errorMessage: "User ID is required" },
  },
});