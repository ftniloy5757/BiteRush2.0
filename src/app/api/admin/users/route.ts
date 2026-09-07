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

    // Build query for role filtering
    const roleQuery: any = {};
    if (role && ["customer", "user", "admin", "rider", "restaurant"].includes(role)) {
      if (role === "customer" || role === "user") {
        roleQuery.role = { $in: ["customer", "user"] };
      } else {
        roleQuery.role = role;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    let rawUsers: any[] = [];
    let totalCount = 0;

    if (search) {
      // When searching, fetch users matching the role and filter across decrypted fields
      const candidates = await User.find(roleQuery)
        .select("-passwordHash -phoneOtp -emailOtp -resetToken")
        .sort({ createdAt: -1 });
      rawUsers = candidates;
    } else {
      totalCount = await User.countDocuments(roleQuery);
      rawUsers = await User.find(roleQuery)
        .select("-passwordHash -phoneOtp -emailOtp -resetToken")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    }

    // Decrypt RSA fields for admin using universal decryptor
    const { decryptUserPayload } = await import("@/lib/crypto/orderDecryptor");
    const users = rawUsers.map((u) => decryptUserPayload(u));

    // Merge in-memory registered dynamic users if they are not already in MongoDB
    try {
      const { getDynamicUsers } = await import("@/lib/dynamicUsersStore");
      const dynamicUsers = getDynamicUsers();
      for (const dyn of dynamicUsers) {
        const exists = users.some((u: any) => String(u._id) === String(dyn._id) || String(u.id) === String(dyn._id));
        if (!exists) {
          users.unshift({
            _id: dyn._id,
            id: dyn._id,
            firstName: dyn.firstName || "Customer",
            lastName: dyn.lastName || "",
            email: dyn.email || "",
            contactNumber: dyn.contactNumber || "",
            role: dyn.role || "customer",
            status: "Online",
            isEmailVerified: dyn.isEmailVerified !== false,
            isPhoneVerified: false,
            createdAt: dyn.createdAt || new Date().toISOString(),
            updatedAt: dyn.updatedAt || new Date().toISOString(),
          });
        }
      }
    } catch {}

    let finalUsers = users;

    if (search) {
      const searchLower = search.trim().toLowerCase();
      finalUsers = users.filter((u: any) => {
        return (
          (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
          (u.lastName && u.lastName.toLowerCase().includes(searchLower)) ||
          (u.email && u.email.toLowerCase().includes(searchLower)) ||
          (u.contactNumber && u.contactNumber.toLowerCase().includes(searchLower)) ||
          (u.restaurantName && u.restaurantName.toLowerCase().includes(searchLower)) ||
          (u.vehicleType && u.vehicleType.toLowerCase().includes(searchLower)) ||
          (u.role && u.role.toLowerCase().includes(searchLower))
        );
      });
      totalCount = finalUsers.length;
      finalUsers = finalUsers.slice(skip, skip + limit);
    } else {
      totalCount = Math.max(totalCount, users.length);
    }

    return NextResponse.json({
      users: finalUsers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit) || 1,
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
