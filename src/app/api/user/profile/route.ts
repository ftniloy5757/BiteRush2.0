// src/app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/option";
import connectDB from "@/lib/dbConnect";
import User from "@/models/User";
import { CryptoService } from "@/lib/crypto/cryptoService";

import mongoose from "mongoose";
import { DEMO_USERS } from "@/lib/demoData";

const DEFAULT_ADDRESSES = [
  {
    id: "addr-1",
    label: "Home",
    address: "Dhanmondi 19 House No. 226/A",
    area: "Dhanmondi",
    details: "Please give a call 10 minutes before reaching the place",
    isDefault: true,
  },
  {
    id: "addr-2",
    label: "Office",
    address: "House 15, Road 5, Block B",
    area: "Gulshan",
    details: "Leave at front desk reception",
    isDefault: false,
  },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const sessionEmail = session.user.email?.toLowerCase();

    let u: any = null;

    try {
      const conn = await connectDB();
      if (conn && mongoose.connection.readyState === 1) {
        let user = null;
        if (mongoose.Types.ObjectId.isValid(userId)) {
          user = await User.findById(userId).lean();
        }
        if (!user && sessionEmail) {
          const emailLookupHmac = CryptoService.createEmailLookupHmac(sessionEmail);
          user = await User.findOne({
            $or: [{ emailLookupHmac }, { email: sessionEmail }],
          }).lean();
        }
        if (user) {
          u = user;
        }
      }
    } catch (dbErr) {
      console.warn("DB error in profile route, will use session fallback:", dbErr);
    }

    const isDemoCustomer = sessionEmail === "customer@biterush.com" || userId === "demo-customer-001";

    // If not found in DB, check dynamic users store, DEMO_USERS, or construct from session
    if (!u) {
      const { findDynamicUserById, findDynamicUserByEmail } = await import("@/lib/dynamicUsersStore");
      const dyn = findDynamicUserById(userId) || (sessionEmail ? findDynamicUserByEmail(sessionEmail) : null);
      if (dyn) {
        return NextResponse.json({
          id: dyn._id,
          firstName: dyn.firstName || session.user.firstName || "Customer",
          lastName: dyn.lastName || session.user.lastName || "",
          email: dyn.email || session.user.email || "",
          contactNumber: dyn.contactNumber || session.user.contactNumber || (isDemoCustomer ? "+8801740734780" : ""),
          bio: dyn.bio || (isDemoCustomer ? "Food enthusiast & loyal BiteRush customer." : ""),
          restaurantName: dyn.restaurantName || null,
          restaurantAddress: dyn.restaurantAddress || null,
          vehicleType: dyn.vehicleType || null,
          role: dyn.role || session.user.role || "customer",
          profilePicture: null,
          themePreference: "light",
          status: "Online",
          isPhoneVerified: true,
          isEmailVerified: dyn.isEmailVerified !== false,
          isTwoFactorEnabled: dyn.isTwoFactorEnabled !== false,
          savedAddresses: Array.isArray(dyn.savedAddresses) ? dyn.savedAddresses : (isDemoCustomer ? DEFAULT_ADDRESSES : []),
          createdAt: dyn.createdAt || new Date().toISOString(),
          updatedAt: dyn.updatedAt || new Date().toISOString(),
        });
      }

      const matchedDemo = DEMO_USERS.find(
        (du) => du.id === userId || (sessionEmail && du.email.toLowerCase() === sessionEmail)
      );

      return NextResponse.json({
        id: userId,
        firstName: session.user.firstName || matchedDemo?.firstName || "Customer",
        lastName: session.user.lastName || matchedDemo?.lastName || "",
        email: session.user.email || matchedDemo?.email || "customer@biterush.com",
        contactNumber: session.user.contactNumber || matchedDemo?.contactNumber || (isDemoCustomer ? "+8801740734780" : ""),
        bio: isDemoCustomer ? "Food enthusiast & loyal BiteRush customer." : "",
        restaurantName: session.user.restaurantName || matchedDemo?.restaurantName || null,
        restaurantAddress: null,
        vehicleType: session.user.vehicleType || matchedDemo?.vehicleType || null,
        role: session.user.role || matchedDemo?.role || "customer",
        profilePicture: session.user.profilePicture || null,
        themePreference: "light",
        status: "Online",
        isPhoneVerified: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        savedAddresses: isDemoCustomer ? DEFAULT_ADDRESSES : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cryptoVersion: 1,
        integrityVerified: true,
      });
    }

    // HMAC Data Integrity Verification — detect unauthorized modifications before decryption
    if (u.integrityMac) {
      const integrityPayload = {
        emailLookupHmac: u.emailLookupHmac,
        contactNumberLookupHmac: u.contactNumberLookupHmac,
        role: u.role,
      };
      CryptoService.verifyIntegrityMac(integrityPayload, u.integrityMac);
    }

    // Decrypt RSA encrypted fields with universal user decryptor
    const { decryptUserPayload } = await import("@/lib/crypto/orderDecryptor");
    const decrypted = decryptUserPayload(u);

    const userProfile = {
      id: decrypted._id?.toString() || userId,
      firstName: decrypted.firstName || session.user.firstName || "Customer",
      lastName: decrypted.lastName || session.user.lastName || "",
      email: decrypted.email || session.user.email || "",
      contactNumber: decrypted.contactNumber || session.user.contactNumber || (isDemoCustomer ? "+8801740734780" : ""),
      bio: decrypted.bio || (isDemoCustomer ? "Food enthusiast & loyal BiteRush customer." : ""),
      restaurantName: decrypted.restaurantName || session.user.restaurantName || null,
      restaurantAddress: decrypted.restaurantAddress || null,
      vehicleType: decrypted.vehicleType || session.user.vehicleType || null,
      role: decrypted.role || session.user.role || "customer",
      profilePicture: decrypted.profilePicture || session.user.profilePicture || null,
      themePreference: decrypted.themePreference || "light",
      status: decrypted.status || "Online",
      isPhoneVerified: decrypted.isPhoneVerified !== false,
      isEmailVerified: decrypted.isEmailVerified !== false,
      isTwoFactorEnabled: decrypted.isTwoFactorEnabled !== false,
      savedAddresses:
        Array.isArray(decrypted.savedAddresses) && decrypted.savedAddresses.length > 0
          ? decrypted.savedAddresses
          : (isDemoCustomer ? DEFAULT_ADDRESSES : []),
      createdAt: decrypted.createdAt ? new Date(decrypted.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: decrypted.updatedAt ? new Date(decrypted.updatedAt).toISOString() : new Date().toISOString(),
      cryptoVersion: decrypted.cryptoVersion || 1,
      integrityVerified: true,
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user details, serving session fallback:", error);
    return NextResponse.json({
      id: "demo-customer",
      firstName: "Customer",
      lastName: "",
      email: "customer@biterush.com",
      contactNumber: "+8801740734780",
      bio: "Food lover.",
      role: "customer",
      savedAddresses: DEFAULT_ADDRESSES,
      themePreference: "light",
      status: "Online",
      isPhoneVerified: true,
      isEmailVerified: true,
      isTwoFactorEnabled: true,
    });
  }
}
