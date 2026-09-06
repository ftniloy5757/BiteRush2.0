import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import User from "@/models/User"; // Using your Mongoose User model
import connectDB from "@/lib/dbConnect";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  try {
    await connectDB();

    const normEmail = email.toLowerCase().trim();
    const { CryptoService } = await import("@/lib/crypto/cryptoService");
    const emailLookupHmac = CryptoService.createEmailLookupHmac(normEmail);

    // Find user by blind lookup HMAC or email
    const user = await User.findOne({
      $or: [{ emailLookupHmac }, { email: normEmail }],
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Decrypt real email if encrypted
    const recipientEmail = user.emailEncrypted
      ? CryptoService.decryptProfile(user.emailEncrypted)
      : user.email;

    // Generate reset token and set expiry
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token information
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Dynamically determine base URL from request headers or environment
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const origin =
      request.headers.get("origin") ||
      (host ? `${proto}://${host}` : null) ||
      process.env.BASEURL ||
      process.env.NEXTAUTH_URL ||
      "https://biterush2.vercel.app";
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    // Send reset email if credentials configured, otherwise log in dev mode
    if (process.env.EMAIL_NAME && process.env.EMAIL_PASS && recipientEmail && recipientEmail !== "[ENCRYPTED]") {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_NAME,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_NAME,
        to: recipientEmail,
        subject: "BiteRush Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #ea580c; margin: 0; font-size: 24px; font-weight: bold;">BiteRush 2.0</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">You requested a password reset for your BiteRush account. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #64748b; font-size: 13px;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; word-break: break-all; color: #ea580c; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <a href="${resetUrl}" style="color: #ea580c; text-decoration: none;">${resetUrl}</a>
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.log(`[Dev Mode] Password reset link for ${user.email}: ${resetUrl}`);
    }

    return NextResponse.json(
      { message: "Password reset email sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
