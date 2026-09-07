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

    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).select(
        "-passwordHash -phoneOtp -emailOtp -resetToken"
      );
    }

    if (!user) {
      try {
        const { findDynamicUserById } = await import("@/lib/dynamicUsersStore");
        const dyn = findDynamicUserById(userId);
        if (dyn) {
          return NextResponse.json(dyn);
        }
      } catch {}
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { decryptUserPayload } = await import("@/lib/crypto/orderDecryptor");
    const userObj = decryptUserPayload(user);
    return NextResponse.json(userObj);
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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    // Encrypt sensitive PII with RSA and mask plaintext
    const { CryptoService } = await import("@/lib/crypto/cryptoService");
    if (updateData.firstName && updateData.firstName !== "[ENCRYPTED]") {
      updateData.firstNameEncrypted = CryptoService.encryptProfile(updateData.firstName);
      updateData.firstName = "[ENCRYPTED]";
    } else if (updateData.firstName === "[ENCRYPTED]") {
      delete updateData.firstName;
    }

    if (updateData.lastName && updateData.lastName !== "[ENCRYPTED]") {
      updateData.lastNameEncrypted = CryptoService.encryptProfile(updateData.lastName);
      updateData.lastName = "[ENCRYPTED]";
    } else if (updateData.lastName === "[ENCRYPTED]") {
      delete updateData.lastName;
    }

    if (updateData.email && updateData.email !== "[ENCRYPTED]") {
      const normEmail = updateData.email.toLowerCase().trim();
      updateData.emailEncrypted = CryptoService.encryptProfile(normEmail);
      updateData.emailLookupHmac = CryptoService.createEmailLookupHmac(normEmail);
      updateData.email = "[ENCRYPTED]";
    } else if (updateData.email === "[ENCRYPTED]") {
      delete updateData.email;
    }

    if (updateData.contactNumber && updateData.contactNumber !== "[ENCRYPTED]") {
      updateData.contactNumberEncrypted = CryptoService.encryptProfile(updateData.contactNumber);
      updateData.contactNumberLookupHmac = CryptoService.createPhoneLookupHmac(updateData.contactNumber);
      updateData.contactNumber = "[ENCRYPTED]";
    } else if (updateData.contactNumber === "[ENCRYPTED]") {
      delete updateData.contactNumber;
    }

    if (updateData.restaurantName && updateData.restaurantName !== "[ENCRYPTED]") {
      updateData.restaurantNameEncrypted = CryptoService.encryptProfile(updateData.restaurantName);
      updateData.restaurantName = "[ENCRYPTED]";
    } else if (updateData.restaurantName === "[ENCRYPTED]") {
      delete updateData.restaurantName;
    }

    if (updateData.restaurantAddress && updateData.restaurantAddress !== "[ENCRYPTED]") {
      updateData.restaurantAddressEncrypted = CryptoService.encryptProfile(updateData.restaurantAddress);
      updateData.restaurantAddress = "[ENCRYPTED]";
    } else if (updateData.restaurantAddress === "[ENCRYPTED]") {
      delete updateData.restaurantAddress;
    }

    if (updateData.vehicleType && updateData.vehicleType !== "[ENCRYPTED]") {
      updateData.vehicleTypeEncrypted = CryptoService.encryptProfile(updateData.vehicleType);
      updateData.vehicleType = "[ENCRYPTED]";
    } else if (updateData.vehicleType === "[ENCRYPTED]") {
      delete updateData.vehicleType;
    }

    // Update integrity MAC
    updateData.integrityMac = CryptoService.generateIntegrityMac({
      emailLookupHmac: updateData.emailLookupHmac || user.emailLookupHmac,
      contactNumberLookupHmac: updateData.contactNumberLookupHmac || user.contactNumberLookupHmac,
      role: updateData.role || user.role,
    });

    let updatedUser: any = null;
    try {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-passwordHash -phoneOtp -emailOtp -resetToken");
    } catch (err: any) {
      if (err.code === 11000 || err.message?.includes("E11000")) {
        try {
          const col = mongoose.connection.db?.collection("users");
          if (col) {
            if (err.message?.includes("contactNumber_1")) {
              await col.dropIndex("contactNumber_1").catch(() => {});
            }
            if (err.message?.includes("email_1")) {
              await col.dropIndex("email_1").catch(() => {});
            }
          }
          updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: false }
          ).select("-passwordHash -phoneOtp -emailOtp -resetToken");
        } catch (retryErr) {
          console.warn("Retry after 11000 failed:", retryErr);
          throw err;
        }
      } else {
        throw err;
      }
    }

    if (!updatedUser) {
      // Check dynamic store fallback
      try {
        const { updateDynamicUser, findDynamicUserById } = await import("@/lib/dynamicUsersStore");
        const dyn = updateDynamicUser(userId, {
          ...(body.firstName ? { firstName: body.firstName } : {}),
          ...(body.lastName ? { lastName: body.lastName } : {}),
          ...(body.email ? { email: body.email.toLowerCase().trim() } : {}),
          ...(body.contactNumber ? { contactNumber: body.contactNumber } : {}),
          ...(body.role ? { role: body.role } : {}),
          ...(body.restaurantName ? { restaurantName: body.restaurantName } : {}),
          ...(body.restaurantAddress ? { restaurantAddress: body.restaurantAddress } : {}),
          ...(body.vehicleType ? { vehicleType: body.vehicleType } : {}),
        });
        if (dyn) {
          return NextResponse.json(dyn);
        }
      } catch {}
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { decryptUserPayload } = await import("@/lib/crypto/orderDecryptor");
    const userObj = decryptUserPayload(updatedUser);
    try {
      // Mirror to dynamic store
      const { updateDynamicUser } = await import("@/lib/dynamicUsersStore");
      updateDynamicUser(userId, userObj);
    } catch {}

    return NextResponse.json(userObj);
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

    let deletedFromDb = false;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const deletedUser = await User.findByIdAndDelete(userId);
      if (deletedUser) {
        deletedFromDb = true;
      }
    }

    // Also mirror delete in dynamic store
    let deletedFromDynamic = false;
    try {
      const { deleteDynamicUser } = await import("@/lib/dynamicUsersStore");
      deletedFromDynamic = deleteDynamicUser(userId);
    } catch {}

    if (!deletedFromDb && !deletedFromDynamic) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}