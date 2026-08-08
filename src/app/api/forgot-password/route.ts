import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import User from "@/models/User"; // Using your Mongoose User model
import connectDB from "@/lib/dbConnect";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  try {
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate reset token and set expiry
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token information
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send reset email
    await transporter.sendMail({
      from: process.env.EMAIL_NAME,
      to: user.email,
      subject: "Password Reset",
      html: `
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${process.env.BASEURL}/reset-password?token=${resetToken}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return NextResponse.json(
      { message: "Password reset email sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
