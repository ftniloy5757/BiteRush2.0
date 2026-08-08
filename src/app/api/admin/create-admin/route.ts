// app/api/admin/create-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/option";

export async function POST(req: NextRequest) {
  try {
    // Get current user's session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await req.json();
    const { firstName, lastName, email, password, contactNumber, bio } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Check if contact number already exists (if provided)
    if (contactNumber) {
      const existingUserPhone = await User.findOne({ contactNumber });
      if (existingUserPhone) {
        return NextResponse.json(
          { error: "Contact number already in use" },
          { status: 400 }
        );
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new admin user with verified status
    const newAdmin = new User({
      firstName,
      lastName,
      email,
      passwordHash,
      role: "admin", // Set role to admin
      contactNumber,
      bio,
      isEmailVerified: true, // Auto-verify email
      isPhoneVerified: contactNumber ? true : false, // Auto-verify phone if provided
    });

    // Save the new admin user
    await newAdmin.save();

    // Return success response (omitting sensitive fields)
    return NextResponse.json(
      {
        success: true,
        message: "Admin user created successfully",
        user: {
          id: newAdmin._id,
          firstName: newAdmin.firstName,
          lastName: newAdmin.lastName,
          email: newAdmin.email,
          role: newAdmin.role,
          contactNumber: newAdmin.contactNumber,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}
