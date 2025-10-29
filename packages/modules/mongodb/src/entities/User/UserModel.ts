import { model } from "mongoose";

import { type IUser } from "./UserTypes";
import UserSchema from "./UserSchema";

export default model<IUser>("User", UserSchema);