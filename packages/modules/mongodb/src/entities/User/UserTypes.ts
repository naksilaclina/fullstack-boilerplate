import { type Document, type Model } from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive: boolean;
  role: "user" | "admin";
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type IUserModel = Model<IUserDocument>;