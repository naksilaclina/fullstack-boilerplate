import mongoose from "mongoose";
import { config, isDevelopment } from "./config";

mongoose.set("strictQuery", false);

export default async function connect(mongodbUri: string) {
  // In development, connect to the Memory Server using centralized configuration
  if (isDevelopment) {
    try {
      // Use the development MongoDB URI from centralized config
      const devUri = config.database.devUri || "mongodb://127.0.0.1:27018/naksilaclina-dev";
      console.log("Using MongoDB Memory Server (from config):", devUri);
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