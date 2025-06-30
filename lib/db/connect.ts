import mongoose from "mongoose";

declare global {
  var mongoose: any;
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "farfield";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

// Construct the full MongoDB URI with database name
const MONGODB_URI_WITH_DB = MONGODB_URI.endsWith("/")
  ? `${MONGODB_URI}${DB_NAME}`
  : `${MONGODB_URI}/${DB_NAME}`;

// Function to clear cached connection (useful for development)
export function clearCache() {
  cached.conn = null;
  cached.promise = null;
  if (mongoose.connection.readyState !== 0) {
    mongoose.disconnect();
  }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log(
      `Using cached connection to database: ${
        cached.conn.connection.db?.databaseName || "unknown"
      }`
    );
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI_WITH_DB, opts)
      .then((mongoose) => {
        console.log(
          `Connected to database: ${
            mongoose.connection.db?.databaseName || "unknown"
          }`
        );
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
