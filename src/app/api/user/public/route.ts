import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { authOptions } from "../../auth/[...nextauth]/option";
import { getServerSession } from "next-auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    await connectDB();

    // Find the user
    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { decryptUserPayload } = await import("@/lib/crypto/orderDecryptor");
    const dec = decryptUserPayload(user);

    // Format the response
    const userProfile = {
      id: (dec._id || userId).toString(),
      firstName: dec.firstName,
      lastName: dec.lastName,
      email: dec.email,
      profilePicture: dec.profilePicture || null,
      bio: dec.bio || "No bio available",
      createdAt: dec.createdAt
        ? new Date(dec.createdAt).toISOString()
        : null,
      updatedAt: dec.updatedAt
        ? new Date(dec.updatedAt).toISOString()
        : null,
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching public user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
