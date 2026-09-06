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
    if (role && ["customer", "user", "admin", "rider", "restaurant"].includes(role)) {
      query.role = role === "user" ? "customer" : role;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const rawUsers = await User.find(query)
      .select("-passwordHash -phoneOtp -emailOtp -resetToken")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Decrypt RSA fields for admin
    const { CryptoService } = await import("@/lib/crypto/cryptoService");
    const sanitizeField = (val: any) => {
      if (!val || typeof val !== "string") return "";
      const trimmed = val.trim();
      if (trimmed.startsWith("{") || trimmed.includes("RSA-1024") || trimmed === "[ENCRYPTED]") {
        return "";
      }
      return trimmed;
    };

    const users = rawUsers.map((u) => {
      const obj = u.toObject();
      if (obj.firstNameEncrypted) {
        obj.firstName = CryptoService.decryptProfile(obj.firstNameEncrypted);
      }
      if (obj.lastNameEncrypted) {
        obj.lastName = CryptoService.decryptProfile(obj.lastNameEncrypted);
      }
      if (obj.emailEncrypted) {
        const decryptedEmail = CryptoService.decryptProfile(obj.emailEncrypted);
        if (decryptedEmail && !decryptedEmail.startsWith("{")) {
          obj.email = decryptedEmail;
        }
      }
      if (obj.contactNumberEncrypted) {
        obj.contactNumber = CryptoService.decryptProfile(obj.contactNumberEncrypted);
      }
      if (obj.restaurantNameEncrypted) {
        obj.restaurantName = CryptoService.decryptProfile(obj.restaurantNameEncrypted);
      }
      if (obj.restaurantAddressEncrypted) {
        obj.restaurantAddress = CryptoService.decryptProfile(obj.restaurantAddressEncrypted);
      }
      if (obj.vehicleTypeEncrypted) {
        obj.vehicleType = CryptoService.decryptProfile(obj.vehicleTypeEncrypted);
      }

      obj.firstName = sanitizeField(obj.firstName);
      obj.lastName = sanitizeField(obj.lastName);
      obj.contactNumber = sanitizeField(obj.contactNumber);
      obj.restaurantName = sanitizeField(obj.restaurantName);
      obj.restaurantAddress = sanitizeField(obj.restaurantAddress);
      obj.vehicleType = sanitizeField(obj.vehicleType);

      // Clean fallback if names are empty or ciphertext
      if (!obj.firstName && !obj.lastName) {
        if (obj.email && typeof obj.email === "string" && !obj.email.startsWith("{")) {
          const prefix = obj.email.split("@")[0];
          obj.firstName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
          obj.lastName = "";
        } else {
          obj.firstName = (obj.role ? obj.role.charAt(0).toUpperCase() + obj.role.slice(1) : "User");
          obj.lastName = `#${String(obj._id).slice(-4)}`;
        }
      }

      return obj;
    });

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
    const { firstName, lastName, email, role, password, contactNumber } = body;
    if (!firstName || !lastName || !email || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normEmail = email.toLowerCase().trim();
    const { CryptoService } = await import("@/lib/crypto/cryptoService");
    const { KeyManager } = await import("@/lib/crypto/keyManager");
    const emailLookupHmac = CryptoService.createEmailLookupHmac(normEmail);
    const contactNumberLookupHmac = contactNumber
      ? CryptoService.createPhoneLookupHmac(contactNumber)
      : undefined;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { emailLookupHmac },
        { email: normEmail },
        ...(contactNumberLookupHmac ? [{ contactNumberLookupHmac }] : []),
      ],
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Encrypt sensitive PII using RSA
    const firstNameEncrypted = CryptoService.encryptProfile(firstName);
    const lastNameEncrypted = CryptoService.encryptProfile(lastName);
    const emailEncrypted = CryptoService.encryptProfile(normEmail);
    const contactNumberEncrypted = contactNumber
      ? CryptoService.encryptProfile(contactNumber)
      : undefined;
    const restaurantNameEncrypted = body.restaurantName
      ? CryptoService.encryptProfile(body.restaurantName)
      : undefined;
    const restaurantAddressEncrypted = body.restaurantAddress
      ? CryptoService.encryptProfile(body.restaurantAddress)
      : undefined;
    const vehicleTypeEncrypted = body.vehicleType
      ? CryptoService.encryptProfile(body.vehicleType)
      : undefined;

    // Generate integrity MAC
    const integrityMac = CryptoService.generateIntegrityMac({
      emailLookupHmac,
      contactNumberLookupHmac,
      role: role || "customer",
    });

    // Create new user with encrypted fields and masked plaintext
    const newUser = new User({
      ...body,
      firstName: "[ENCRYPTED]",
      lastName: "[ENCRYPTED]",
      email: "[ENCRYPTED]",
      contactNumber: contactNumber ? "[ENCRYPTED]" : undefined,
      restaurantName: body.restaurantName ? "[ENCRYPTED]" : undefined,
      restaurantAddress: body.restaurantAddress ? "[ENCRYPTED]" : undefined,
      vehicleType: body.vehicleType ? "[ENCRYPTED]" : undefined,
      firstNameEncrypted,
      lastNameEncrypted,
      emailEncrypted,
      contactNumberEncrypted,
      restaurantNameEncrypted,
      restaurantAddressEncrypted,
      vehicleTypeEncrypted,
      emailLookupHmac,
      contactNumberLookupHmac,
      integrityMac,
      cryptoVersion: KeyManager.getActiveVersion(),
      passwordHash,
      isEmailVerified: true, // Admin-created accounts are pre-verified
    });

    await newUser.save();

    // Mirror to dynamic store
    try {
      const { addDynamicUser } = await import("@/lib/dynamicUsersStore");
      addDynamicUser({
        _id: newUser._id.toString(),
        id: newUser._id.toString(),
        firstName,
        lastName,
        email: normEmail,
        contactNumber,
        role: role || "customer",
        passwordHash,
        restaurantName: body.restaurantName,
        restaurantAddress: body.restaurantAddress,
        vehicleType: body.vehicleType,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
      });
    } catch {}

    // Return user data with decrypted fields for display
    const userData = newUser.toObject();
    delete userData.passwordHash;
    delete userData.phoneOtp;
    delete userData.emailOtp;
    delete userData.resetToken;
    userData.firstName = firstName;
    userData.lastName = lastName;
    userData.email = normEmail;
    userData.contactNumber = contactNumber;
    userData.restaurantName = body.restaurantName;
    userData.restaurantAddress = body.restaurantAddress;
    userData.vehicleType = body.vehicleType;

    return NextResponse.json(userData, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
