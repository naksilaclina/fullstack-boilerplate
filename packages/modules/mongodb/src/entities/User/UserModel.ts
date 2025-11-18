import { model } from "mongoose";

import UserSchema from "./UserSchema";

export default model("User", UserSchema);