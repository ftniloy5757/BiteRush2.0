// /app/api/admin/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";

// Helper function to check if user is admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

// GET - Fetch a specific user
export async function GET(req: NextRequest, context: any) {
  try {
    const { userId } = await context.params;
    // Check admin authorization
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await User.findById(userId).select(
      "-passwordHash -phoneOtp -emailOtp -resetToken"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update a user
export async function PATCH(req: NextRequest, context: any) {
  try {
    const { userId } = await context.params;
    // Check admin authorization
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Remove sensitive fields from update
    const {
      passwordHash,
      resetToken,
      resetTokenExpiry,
      phoneOtp,
      emailOtp,
      ...updateData
    } = body;

    // Special handling for password if provided
    if (body.password) {
      updateData.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-passwordHash -phoneOtp -emailOtp -resetToken");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a user
export async function DELETE(req: NextRequest, context: any) {
  try {
    const { userId } = await context.params;
    // Check admin authorization
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}