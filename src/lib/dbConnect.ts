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

export const connectDB = async () => {
  const envUri = process.env.MONGODB_URI;
  const uri =
    envUri && !envUri.includes("<username>") && !envUri.includes("<password>")
      ? envUri
      : DEFAULT_MONGODB_URI;

  mongoose.set("bufferCommands", false);

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      })
      .then((mongooseInstance) => {
        cached.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.warn("MongoDB connection notice:", err?.message || err);
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    return null;
  }

  return cached.conn;
};

export default connectDB;
