import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import axios from "axios";
import User from "@/models/User"; // Using your Mongoose User model
import connectDB from "@/lib/dbConnect";

export async function POST(request: NextRequest) {
  const { type, email, phone } = await request.json();

  try {
    await connectDB();

    if (type === "email") {
      const emailOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update the user with the new OTP
      await User.findOneAndUpdate(
        { email },
        {
          emailOtp,
          emailOtpExpiresAt,
        }
      );

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP for email verification is ${emailOtp}`,
      });
    } else if (type === "phone") {
      const phoneOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const phoneOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Find user by contact number
      const user = await User.findOne({ contactNumber: phone });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      // Update the user with the new phone OTP
      user.phoneOtp = phoneOtp;
      user.phoneOtpExpiresAt = phoneOtpExpiresAt;
      await user.save();

      const apiKey = process.env.SMS_API_KEY;
      const senderId = process.env.SMS_SENDER_ID;

      await axios.post("http://bulksmsbd.net/api/smsapi", {
        api_key: apiKey,
        senderid: senderId,
        number: phone,
        message: `Your OTP is ${phoneOtp}`,
      });
    }

    return NextResponse.json(
      { success: true, message: `OTP sent to ${type}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
