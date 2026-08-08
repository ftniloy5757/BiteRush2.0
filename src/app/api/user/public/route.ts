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

    // Format the response
    const userProfile = {
      id: (user as any)._id.toString(),
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
      email: (user as any).email,
      profilePicture: (user as any).profilePicture || null,
      bio: (user as any).bio || "No bio available",
      createdAt: (user as any).createdAt
        ? new Date((user as any).createdAt).toISOString()
        : null,
      updatedAt: (user as any).updatedAt
        ? new Date((user as any).updatedAt).toISOString()
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
