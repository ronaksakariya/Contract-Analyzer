import mongoose from "mongoose";

import { config } from "./config.js";
import { logger } from "./logger.js";

/**
 * Connect to MongoDB. If no URI is configured we log a warning and continue
 * so the API can still serve `/health` during Phase 0 scaffolding.
 */
export async function connectDb(): Promise<typeof mongoose | null> {
  if (!config.mongodbUri) {
    logger.warn("MONGODB_URI is not set; skipping database connection.");
    return null;
  }

  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("error", (error) => logger.error({ err: error }, "MongoDB error"));

  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 10_000 });
    return mongoose;
  } catch (error) {
    // In production a broken database is fatal. In development/test we keep the
    // HTTP server up so `/health` still answers and reports `db: "disconnected"`,
    // which is far more useful than a dead process while scaffolding. The
    // Phase 1 worker will retry the connection when it needs the database.
    if (config.isProd) throw error;
    logger.error(
      { err: error },
      "Could not connect to MongoDB; continuing without a database (development only).",
    );
    return null;
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

/** `connected` when Mongoose reports a live connection, else `disconnected`. */
export function dbStatus(): "connected" | "disconnected" {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}
