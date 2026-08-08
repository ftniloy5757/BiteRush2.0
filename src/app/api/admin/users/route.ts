// /app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/option";
import bcrypt from "bcryptjs";

// Helper function to check if user is admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

// GET - Fetch all users
export async function GET(req: NextRequest) {
  try {
    // Check admin authorization
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Connect to database
    await dbConnect();

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "";

    // Build query
    const query: any = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role if provided
    if (role && ["user", "admin", "rider"].includes(role)) {
      query.role = role;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const users = await User.find(query)
      .select("-passwordHash -phoneOtp -emailOtp -resetToken")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await User.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new user (admin only)
export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Connect to database
    await dbConnect();

    const body = await req.json();

    // Validate required fields
    const { firstName, lastName, email, role, password } = body;
    if (!firstName || !lastName || !email || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password

    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      ...body,
      passwordHash,
      isEmailVerified: true, // Admin-created accounts are pre-verified
    });

    await newUser.save();

    // Return user data without sensitive information
    const userData = newUser.toObject();
    delete userData.passwordHash;
    delete userData.phoneOtp;
    delete userData.emailOtp;
    delete userData.resetToken;

    return NextResponse.json(userData, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
