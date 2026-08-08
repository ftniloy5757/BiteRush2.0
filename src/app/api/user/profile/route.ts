import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/option";
import connectDB from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // We only show the logged-in user's own profile
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user
    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Format response
    const userProfile = {
      id: (user as any)._id,
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
      email: (user as any).email,
      contactNumber: (user as any).contactNumber || null,
      bio: (user as any).bio || "No bio available",
      profilePicture: (user as any).profilePicture || null,
      themePreference: (user as any).themePreference,
      status: (user as any).status,
      isPhoneVerified: (user as any).isPhoneVerified,
      isEmailVerified: (user as any).isEmailVerified,
      createdAt: (user as any).createdAt
        ? new Date((user as any).createdAt).toISOString()
        : null,
      updatedAt: (user as any).updatedAt
        ? new Date((user as any).updatedAt).toISOString()
        : null,
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
