// src/models/Post.ts
import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";

export interface IPost extends Document {
  // Plaintext placeholder fields (store "[ENCRYPTED]" only)
  title: string;
  content: string;

  // ECC secp256k1 ElGamal encrypted fields
  titleEncrypted: string;
  contentEncrypted: string;

  // Metadata
  category: "Food Review" | "Restaurant Recommendation" | "Diet & Recipes" | "General Discussion";
  author: mongoose.Types.ObjectId | IUser;
  authorName: string;
  likes: number;

  // Cryptographic versioning & integrity
  cryptoVersion: number;
  integrityMac: string;

  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, default: "[ENCRYPTED]" },
    content: { type: String, default: "[ENCRYPTED]" },

    // ECC Encrypted Data
    titleEncrypted: { type: String, required: true },
    contentEncrypted: { type: String, required: true },

    // Post Metadata
    category: {
      type: String,
      enum: ["Food Review", "Restaurant Recommendation", "Diet & Recipes", "General Discussion"],
      default: "General Discussion",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: { type: String, default: "[ENCRYPTED]" },
    likes: { type: Number, default: 0 },

    // Cryptographic metadata
    cryptoVersion: { type: Number, default: 1 },
    integrityMac: { type: String, required: true },
  },
  { timestamps: true, bufferCommands: false }
);

const Post = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);

export default Post;
