// app/api/user/profile/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import connectDB from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";

// GET current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch user profile, excluding sensitive fields
    const user = await User.findById(userId).select(
      "-passwordHash -resetToken -resetTokenExpiry -emailOtp -phoneOtp"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Get the updated profile data
    const { firstName, lastName, bio, contactNumber, themePreference, status } =
      await request.json();

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Check if contact number is being changed and validate uniqueness if so
    if (contactNumber) {
      const existingUserWithPhone = await User.findOne({
        contactNumber,
        _id: { $ne: userId },
      });

      if (existingUserWithPhone) {
        return NextResponse.json(
          { error: "Phone number is already in use" },
          { status: 400 }
        );
      }
    }

    // Prepare the update object with only provided fields
    const updateData: Record<string, any> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (themePreference) updateData.themePreference = themePreference;
    if (status) updateData.status = status;

    // Update the user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true } // Return the updated document
    ).select("-passwordHash -resetToken -resetTokenExpiry -emailOtp -phoneOtp");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update profile picture (separate endpoint for file handling)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // For simplicity, we're assuming the profile picture URL is passed directly
    // In a real implementation, you would handle file uploads to a service like S3
    const { profilePicture } = await request.json();

    if (!profilePicture) {
      return NextResponse.json(
        { error: "Profile picture URL is required" },
        { status: 400 }
      );
    }

    // Update only the profile picture
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture },
      { new: true }
    ).select("-passwordHash -resetToken -resetTokenExpiry -emailOtp -phoneOtp");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile picture updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
