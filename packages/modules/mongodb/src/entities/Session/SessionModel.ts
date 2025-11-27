import { model } from "mongoose";
import SessionSchema from "./SessionSchema";

// Import the interface directly
import type { ISession } from "./SessionTypes";

// Export the model without explicit typing to avoid complex union type issues
export default model("Session", SessionSchema);
