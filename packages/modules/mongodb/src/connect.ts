import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import mongoose from "mongoose";

mongoose.set("strictQuery", false);

export default async function connect(mongodbUri: string) {
  // In development, connect to the Memory Server using environment variable
  if (process.env.NODE_ENV === "development") {
    try {
      // Use the development MongoDB URI from environment variables
      const devUri = process.env.MONGODB_DEV_URI || "mongodb://127.0.0.1:27018/naksilaclina-dev";
      console.log("Using MongoDB Memory Server (from env):", devUri);
      return await mongoose.connect(devUri);
    } catch (error) {
      console.log("Failed to connect to MongoDB Memory Server, using provided URI:", mongodbUri);
      return await mongoose.connect(mongodbUri);
    }
  } else {
    // In production, use the provided URI
    return await mongoose.connect(mongodbUri);
  }
}