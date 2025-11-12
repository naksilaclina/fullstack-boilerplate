import { type IUserDocument } from "@naksilaclina/mongodb";

export interface IGetUsersDocument extends IUserDocument {
  createdAt: Date;
  updatedAt: Date;
}

export interface IGetUsersResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export const documentToRecord = (document: IGetUsersDocument): IGetUsersResponse => {
  return {
    _id: document._id.toString(),
    firstName: document.firstName,
    lastName: document.lastName,
    email: document.email,
    isActive: document.isActive,
    role: document.role,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
};

export interface GetUsersActionResults {
  status: number;
  body: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    records: IGetUsersResponse[];
  };
}