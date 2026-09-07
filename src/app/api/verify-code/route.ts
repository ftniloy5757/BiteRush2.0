// src/app/api/verify-code/route.ts
import User from "@/models/User";
import connectDB from "@/lib/dbConnect";
import mongoose from "mongoose";
import { CryptoService } from "@/lib/crypto/cryptoService";
import { findDynamicUserById, updateDynamicUser } from "@/lib/dynamicUsersStore";

const DEDICATED_TESTING_EMAILS = [
  "customer@biterush.com",
  "restaurant@biterush.com",
  "rider@biterush.com",
  "admin@biterush.com",
];

export const POST = async (request: Request) => {
  const { userId, emailOtp, code } = await request.json();
  const inputCode = (code || emailOtp || "").trim();

  try {
    let userVerified = false;

    try {
      await connectDB();
      let user = null;
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
      if (!user && userId) {
        const searchEmail = String(userId).toLowerCase().trim();
        const hmac = CryptoService.createEmailLookupHmac(searchEmail);
        user = await User.findOne({
          $or: [{ emailLookupHmac: hmac }, { email: searchEmail }],
        });
      }
      if (user) {
          const userEmail = (
            user.email === "[ENCRYPTED]" && user.emailEncrypted
              ? CryptoService.decryptProfile(user.emailEncrypted)
              : user.email || ""
          ).toLowerCase().trim();

          const isTestingUser = DEDICATED_TESTING_EMAILS.includes(userEmail);
          const storedOtp = user.emailOtp || user.twoFactorOtp;
          const expiresAt = user.emailOtpExpiresAt || user.twoFactorOtpExpiresAt;

          // Strict Security: 123456 is ONLY valid for the 4 dedicated testing emails
          const isValid =
            (isTestingUser && inputCode === "123456") ||
            CryptoService.verifyOTP(inputCode, storedOtp, expiresAt);

          if (!isValid) {
            return new Response(
              JSON.stringify({ success: false, message: "Invalid or expired verification code" }),
              { status: 400 }
            );
          }

          await User.updateOne(
            { _id: user._id },
            {
              $set: { isEmailVerified: true, isTwoFactorVerified: true },
              $unset: {
                emailOtp: 1,
                emailOtpExpiresAt: 1,
                twoFactorOtp: 1,
                twoFactorOtpExpiresAt: 1,
              },
            }
          );
          userVerified = true;
        }
    } catch (dbErr) {
      console.warn("DB verify-code check error, falling back to dynamic store:", dbErr);
    }

    if (!userVerified) {
      const dynamicUser = findDynamicUserById(userId);
      if (dynamicUser) {
        const userEmail = (dynamicUser.email || "").toLowerCase().trim();
        const isTestingUser = DEDICATED_TESTING_EMAILS.includes(userEmail);
        const storedOtp = dynamicUser.emailOtp || dynamicUser.twoFactorOtp;
        const expiresAt = dynamicUser.emailOtpExpiresAt || dynamicUser.twoFactorOtpExpiresAt;

        // Strict Security: 123456 is ONLY valid for the 4 dedicated testing emails
        const isValid =
          (isTestingUser && inputCode === "123456") ||
          CryptoService.verifyOTP(inputCode, storedOtp, expiresAt);

        if (!isValid) {
          return new Response(
            JSON.stringify({ success: false, message: "Invalid or expired verification code" }),
            { status: 400 }
          );
        }

        updateDynamicUser(userId, {
          isEmailVerified: true,
          isTwoFactorVerified: true,
          emailOtp: undefined,
          twoFactorOtp: undefined,
        });

        // Ensure verified user is persisted in MongoDB
        try {
          await connectDB();
          const emailLookupHmac = CryptoService.createEmailLookupHmac(userEmail);
          const existingInDb = await User.findOne({
            $or: [{ emailLookupHmac }, { email: userEmail }],
          });
          if (!existingInDb) {
            const newUser = new User({
              firstName: "[ENCRYPTED]",
              lastName: "[ENCRYPTED]",
              email: "[ENCRYPTED]",
              contactNumber: "[ENCRYPTED]",
              role: dynamicUser.role || "customer",
              passwordHash: dynamicUser.passwordHash,
              firstNameEncrypted: dynamicUser.firstNameEncrypted,
              lastNameEncrypted: dynamicUser.lastNameEncrypted,
              emailEncrypted: dynamicUser.emailEncrypted,
              contactNumberEncrypted: dynamicUser.contactNumberEncrypted,
              restaurantNameEncrypted: dynamicUser.restaurantNameEncrypted,
              restaurantAddressEncrypted: dynamicUser.restaurantAddressEncrypted,
              vehicleTypeEncrypted: dynamicUser.vehicleTypeEncrypted,
              emailLookupHmac,
              contactNumberLookupHmac: dynamicUser.contactNumberLookupHmac,
              isEmailVerified: true,
              isTwoFactorEnabled: true,
              isTwoFactorVerified: true,
              cryptoVersion: 1,
              integrityMac: dynamicUser.integrityMac,
            });
            await newUser.save();
          } else {
            await User.updateOne(
              { _id: existingInDb._id },
              { $set: { isEmailVerified: true, isTwoFactorVerified: true } }
            );
          }
        } catch (e) {
          console.warn("Sync verified user to MongoDB notice:", e);
        }

        userVerified = true;
      }
    }

    if (!userVerified) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found or code expired" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "2FA Verification successful" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("2FA verification error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Verification failed" }),
      { status: 500 }
    );
  }
};
