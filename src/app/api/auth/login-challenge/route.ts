// src/app/api/auth/login-challenge/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/lib/dbConnect";
import { CryptoService } from "@/lib/crypto/cryptoService";
import { DEMO_USERS } from "@/lib/demoData";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_NAME,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * POST /api/auth/login-challenge
 *
 * Step 1 of Two-Step Authentication:
 * Validates primary credentials (email/phone + password) and generates a 6-digit
 * HMAC-SHA256 OTP as the second factor. The OTP is stored on the user record and
 * optionally emailed. The actual NextAuth session is NOT created here — it requires
 * the OTP to be submitted to signIn("credentials", { identifier, password, otp }).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const rawIdentifier = identifier.trim();

    // Enforce email-only login: reject phone numbers
    if (!rawIdentifier.includes("@") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawIdentifier)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address. Phone number login is not allowed." },
        { status: 400 }
      );
    }

    const normalizedEmail = rawIdentifier.toLowerCase();

    // Compute deterministic HMAC lookup tokens
    const emailLookupHmac = CryptoService.createEmailLookupHmac(normalizedEmail);

    // 1. Try MongoDB lookup
    let userId: string | null = null;
    let maskedEmail = "";

    try {
      const conn = await connectDB();
      if (conn) {
        let user = await User.findOne({
          $or: [
            { emailLookupHmac },
            { email: normalizedEmail },
          ],
        });

        if (!user) {
          // Auto seed demo data if collection is empty
          try {
            const { seedDemoData } = await import("@/lib/seedDemoUsers");
            await seedDemoData();
            user = await User.findOne({
              $or: [
                { emailLookupHmac },
                { email: normalizedEmail },
              ],
            });
          } catch {
            // Silently continue if seed fails
          }
        }

        if (user) {
          const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

          if (isPasswordCorrect) {
            // Generate 6-digit OTP using custom HMAC-SHA256
            const { otp, expiresAt } = CryptoService.generateOTP();

            // Store OTP on user record for verification atomically
            await User.updateOne(
              { _id: user._id },
              { $set: { twoFactorOtp: otp, twoFactorOtpExpiresAt: expiresAt } }
            );

            userId = user._id.toString();

            // Mask email for privacy display
            const decryptedEmail = user.emailEncrypted
              ? CryptoService.decryptProfile(user.emailEncrypted)
              : user.email;
            if (decryptedEmail && decryptedEmail !== "[ENCRYPTED]") {
              const [local, domain] = decryptedEmail.split("@");
              maskedEmail = `${local.slice(0, 2)}***@${domain}`;
            } else {
              maskedEmail = "***@***.com";
            }

            // Send OTP via email to the customer
            try {
              if (process.env.EMAIL_NAME && process.env.EMAIL_PASS && decryptedEmail && decryptedEmail !== "[ENCRYPTED]") {
                await transporter.sendMail({
                  from: process.env.EMAIL_NAME,
                  to: decryptedEmail,
                  subject: "BiteRush Login Verification Code (2FA)",
                  text: `Your BiteRush two-factor authentication code is: ${otp}\n\nThis code is valid for 10 minutes. Do not share this code with anyone.`,
                });
              } else {
                console.log(`[Email Notice] 2FA OTP for ${decryptedEmail}: ${otp}`);
              }
            } catch (emailErr) {
              console.warn("Failed to send 2FA email:", emailErr);
            }

            return NextResponse.json({
              success: true,
              requires2FA: true,
              userId,
              maskedEmail,
              message: "Credentials verified. A 6-digit verification code has been sent to your email.",
            });
          }
        }
      }
    } catch (dbErr) {
      console.warn("DB authentication challenge failed:", dbErr);
    }

    // 2. Check Dynamic Users Store (resilient offline / serverless registration fallback)
    const { findDynamicUserByEmail, updateDynamicUser } = await import("@/lib/dynamicUsersStore");
    const dynamicUser = findDynamicUserByEmail(normalizedEmail);
    if (dynamicUser) {
      const isPasswordCorrect = await bcrypt.compare(password, dynamicUser.passwordHash);
      if (isPasswordCorrect) {
        const { otp, expiresAt } = CryptoService.generateOTP();
        updateDynamicUser(dynamicUser._id, {
          twoFactorOtp: otp,
          twoFactorOtpExpiresAt: expiresAt,
        });

        // Ensure this user is persisted into MongoDB Atlas so they become permanent
        try {
          await connectDB();
          const existingInDb = await User.findOne({
            $or: [{ emailLookupHmac }, { email: normalizedEmail }],
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
              twoFactorOtp: otp,
              twoFactorOtpExpiresAt: expiresAt,
              isEmailVerified: true,
              isTwoFactorEnabled: true,
              isTwoFactorVerified: false,
              cryptoVersion: 1,
              integrityMac: dynamicUser.integrityMac,
            });
            await newUser.save();
          } else {
            await User.updateOne(
              { _id: existingInDb._id },
              { $set: { twoFactorOtp: otp, twoFactorOtpExpiresAt: expiresAt } }
            );
          }
        } catch (syncErr) {
          console.warn("Sync dynamic user to MongoDB notice:", syncErr);
        }

        const [local, domain] = normalizedEmail.split("@");
        const maskedEmail = `${local.slice(0, 2)}***@${domain}`;

        try {
          if (process.env.EMAIL_NAME && process.env.EMAIL_PASS) {
            await transporter.sendMail({
              from: process.env.EMAIL_NAME,
              to: normalizedEmail,
              subject: "BiteRush Login Verification Code (2FA)",
              text: `Your BiteRush two-factor authentication code is: ${otp}\n\nThis code is valid for 10 minutes. Do not share this code with anyone.`,
            });
          } else {
            console.log(`[Email Notice] 2FA OTP for ${normalizedEmail}: ${otp}`);
          }
        } catch (emailErr) {
          console.warn("Failed to send 2FA email:", emailErr);
        }

        return NextResponse.json({
          success: true,
          requires2FA: true,
          userId: dynamicUser._id,
          maskedEmail,
          message: "Credentials verified. A 6-digit verification code has been sent to your email.",
        });
      }
    }

    // 3. Fallback: Check dedicated demo users only (strictly the 4 testing emails)
    const DEDICATED_TESTING_EMAILS = [
      "customer@biterush.com",
      "restaurant@biterush.com",
      "rider@biterush.com",
      "admin@biterush.com",
    ];

    if (DEDICATED_TESTING_EMAILS.includes(normalizedEmail)) {
      const matchedDemoUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
      );

      if (matchedDemoUser) {
        const { otp } = CryptoService.generateOTP();
        const [local, domain] = matchedDemoUser.email.split("@");
        maskedEmail = `${local.slice(0, 2)}***@${domain}`;

        // Attempt sending realtime OTP to demo user email
        try {
          if (process.env.EMAIL_NAME && process.env.EMAIL_PASS) {
            await transporter.sendMail({
              from: process.env.EMAIL_NAME,
              to: matchedDemoUser.email,
              subject: "BiteRush Login Verification Code (2FA)",
              text: `Your BiteRush two-factor authentication code is: ${otp}\n\nDemo test code: 123456\nThis code is valid for 10 minutes.`,
            });
          } else {
            console.log(`[Demo Notice] 2FA OTP for ${matchedDemoUser.email}: ${otp} (Demo code: 123456)`);
          }
        } catch (emailErr) {
          console.warn("Failed to send demo 2FA email:", emailErr);
        }

        // Try to store OTP on the demo user in DB if possible
        try {
          const conn = await connectDB();
          if (conn) {
            await User.findOneAndUpdate(
              {
                $or: [
                  { emailLookupHmac },
                  { email: matchedDemoUser.email },
                ],
              },
              { twoFactorOtp: otp, twoFactorOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) }
            );
          }
        } catch {
          // Continue even if DB update fails
        }

        return NextResponse.json({
          success: true,
          requires2FA: true,
          userId: matchedDemoUser.id,
          maskedEmail,
          message: "Credentials verified. A verification code has been sent to your email.",
        });
      }
    }

    // Invalid credentials
    return NextResponse.json(
      { success: false, message: "Invalid email or password." },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Login challenge error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
