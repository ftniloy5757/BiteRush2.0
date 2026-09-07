/* eslint-disable no-var */
import mongoose from "mongoose";

const DEFAULT_MONGODB_URI =
  "mongodb+srv://farhantanvirniloy:VIdRwORkamclJ8gO@cluster0.89jojjo.mongodb.net/biterush?retryWrites=true&w=majority&appName=Cluster0";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export const connectDB = async (): Promise<typeof mongoose> => {
  const envUri = process.env.MONGODB_URI;
  const uri =
    envUri && !envUri.includes("<username>") && !envUri.includes("<password>")
      ? envUri
      : DEFAULT_MONGODB_URI;

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection was disconnected or closed, reset cache
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.promise = null;
    cached.conn = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((mongooseInstance) => {
        cached.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        console.error("MongoDB connection notice:", err?.message || err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn || mongoose;
};

export default connectDB;
