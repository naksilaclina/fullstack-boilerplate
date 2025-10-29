import mongoose from "mongoose";
import SessionSchema from "./SessionSchema";

// Import the interface directly
import type { ISession } from "./SessionTypes";

// Create and export the model
const SessionModel = mongoose.model<ISession>("Session", SessionSchema);

export default SessionModel;