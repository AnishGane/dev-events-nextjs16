import mongoose, { type Connection, type ConnectOptions, type Mongoose } from "mongoose";

/**
 * Shape of the cached connection object stored on the global scope.
 * This avoids creating multiple connections in development where
 * Next.js hot reloading can cause modules to be re-evaluated.
 */
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Mongoose> | null;
}

// Augment the Node.js global type so TypeScript knows about our cache.
declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Throw early so misconfiguration is caught during startup rather than at first query.
  throw new Error("Please define the MONGODB_URI environment variable in your .env file");
}

// Reuse the existing cached instance if it exists, otherwise initialize it.
const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };

if (!global._mongoose) {
  global._mongoose = cached;
}

/**
 * Establishes (or reuses) a single Mongoose connection.
 *
 * This function is safe to call from API routes, server components, and
 * server actions. It guarantees that only one connection is created per
 * server runtime, even under hot reloading in development.
 */
export async function connectToDatabase(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options: ConnectOptions = {
      // Add any connection options you need here (e.g., serverSelectionTimeoutMS).
      // Keep it minimal to let MongoDB/Mongoose use sensible defaults.
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, options);
  }

  const mongooseInstance = await cached.promise;

  cached.conn = mongooseInstance.connection;
  return cached.conn;
}
