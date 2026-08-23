// src/app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/option";
import connectDB from "@/lib/dbConnect";
import User from "@/models/User";
import { CryptoService } from "@/lib/crypto/cryptoService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Decrypt RSA encrypted fields if present
    const u = user as any;
    const firstName = u.firstNameEncrypted
      ? CryptoService.decryptProfile(u.firstNameEncrypted)
      : u.firstName;
    const lastName = u.lastNameEncrypted
      ? CryptoService.decryptProfile(u.lastNameEncrypted)
      : u.lastName;
    const email = u.emailEncrypted
      ? CryptoService.decryptProfile(u.emailEncrypted)
      : u.email;
    const contactNumber = u.contactNumberEncrypted
      ? CryptoService.decryptProfile(u.contactNumberEncrypted)
      : u.contactNumber || null;
    const bio = u.bioEncrypted
      ? CryptoService.decryptProfile(u.bioEncrypted)
      : u.bio || "No bio available";
    const restaurantName = u.restaurantNameEncrypted
      ? CryptoService.decryptProfile(u.restaurantNameEncrypted)
      : u.restaurantName || null;
    const restaurantAddress = u.restaurantAddressEncrypted
      ? CryptoService.decryptProfile(u.restaurantAddressEncrypted)
      : u.restaurantAddress || null;
    const vehicleType = u.vehicleTypeEncrypted
      ? CryptoService.decryptProfile(u.vehicleTypeEncrypted)
      : u.vehicleType || null;

    const userProfile = {
      id: u._id,
      firstName,
      lastName,
      email,
      contactNumber,
      bio,
      restaurantName,
      restaurantAddress,
      vehicleType,
      role: u.role,
      profilePicture: u.profilePicture || null,
      themePreference: u.themePreference,
      status: u.status,
      isPhoneVerified: u.isPhoneVerified,
      isEmailVerified: u.isEmailVerified,
      isTwoFactorEnabled: u.isTwoFactorEnabled,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : null,
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
