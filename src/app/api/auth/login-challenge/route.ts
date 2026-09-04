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
        { success: false, message: "Email/phone and password are required." },
        { status: 400 }
      );
    }

    const rawIdentifier = identifier.trim();
    const normalizedEmail = rawIdentifier.toLowerCase();

    // Compute deterministic HMAC lookup tokens
    const emailLookupHmac = CryptoService.createEmailLookupHmac(normalizedEmail);
    const phoneLookupHmac = CryptoService.createPhoneLookupHmac(rawIdentifier);

    // 1. Try MongoDB lookup
    let userId: string | null = null;
    let maskedEmail = "";
    let debugOtp: string | undefined;

    try {
      const conn = await connectDB();
      if (conn) {
        let user = await User.findOne({
          $or: [
            { emailLookupHmac },
            { contactNumberLookupHmac: phoneLookupHmac },
            { email: normalizedEmail },
            { contactNumber: rawIdentifier },
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
                { contactNumberLookupHmac: phoneLookupHmac },
                { email: normalizedEmail },
                { contactNumber: rawIdentifier },
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

            // Store OTP on user record for verification
            user.twoFactorOtp = otp;
            user.twoFactorOtpExpiresAt = expiresAt;
            await user.save();

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

            // Send OTP via email if configured
            try {
              if (process.env.EMAIL_NAME && process.env.EMAIL_PASS && decryptedEmail && decryptedEmail !== "[ENCRYPTED]") {
                await transporter.sendMail({
                  from: process.env.EMAIL_NAME,
                  to: decryptedEmail,
                  subject: "BiteRush Login Verification Code (2FA)",
                  text: `Your BiteRush two-factor authentication code is: ${otp}\n\nThis code is valid for 10 minutes. Do not share this code with anyone.`,
                });
              }
            } catch (emailErr) {
              console.warn("Failed to send 2FA email:", emailErr);
            }

            // Include OTP in response for dev/testing environments
            if (process.env.NODE_ENV !== "production") {
              debugOtp = otp;
            }

            return NextResponse.json({
              success: true,
              requires2FA: true,
              userId,
              maskedEmail,
              message: "Credentials verified. A 6-digit verification code has been sent to your email.",
              ...(debugOtp ? { debugOtp } : {}),
            });
          }
        }
      }
    } catch (dbErr) {
      console.warn("DB authentication challenge failed:", dbErr);
    }

    // 2. Fallback: Check demo users
    const matchedDemoUser = DEMO_USERS.find(
      (u) =>
        (u.email.toLowerCase() === normalizedEmail || u.contactNumber === rawIdentifier) &&
        u.password === password
    );

    if (matchedDemoUser) {
      // For demo users, generate OTP and return it directly for testing
      const { otp } = CryptoService.generateOTP();
      const [local, domain] = matchedDemoUser.email.split("@");
      maskedEmail = `${local.slice(0, 2)}***@${domain}`;

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
        message: "Credentials verified. Enter the verification code to complete login.",
        debugOtp: otp,
      });
    }

    // Invalid credentials
    return NextResponse.json(
      { success: false, message: "Invalid email/phone or password." },
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
