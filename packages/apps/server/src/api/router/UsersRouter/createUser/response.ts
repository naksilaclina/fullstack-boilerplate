import { type IUserDocument } from "@naksilaclina/mongodb";

export interface ICreateUserDocument extends IUserDocument {
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export const documentToRecord = (document: ICreateUserDocument): ICreateUserResponse => {
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

export interface CreateUserActionResults {
  status: number;
  body: ICreateUserResponse;
}