import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import axios from "axios";
import User from "@/models/User"; // Using your Mongoose User model
import connectDB from "@/lib/dbConnect";

import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  const { type, email, phone, userId } = await request.json();

  try {
    await connectDB();

    const { CryptoService } = await import("@/lib/crypto/cryptoService");

    if (type === "email") {
      const { otp: emailOtp, expiresAt: emailOtpExpiresAt } = CryptoService.generateOTP();
      let user = null;

      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }

      if (!user) {
        const targetEmail = (email || userId || "").toLowerCase().trim();
        if (targetEmail && targetEmail.includes("@")) {
          const emailLookupHmac = CryptoService.createEmailLookupHmac(targetEmail);
          user = await User.findOne({
            $or: [{ emailLookupHmac }, { email: targetEmail }],
          });
        }
      }

      if (!user) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
      }

      await User.updateOne(
        { _id: user._id },
        { $set: { emailOtp, emailOtpExpiresAt } }
      );

      const recipientEmail = user.emailEncrypted
        ? CryptoService.decryptProfile(user.emailEncrypted)
        : user.email;

      const emailUser = process.env.EMAIL_NAME || process.env.GMAIL_USER;
      const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_PASSWORD;

      if (emailUser && emailPass && recipientEmail && recipientEmail !== "[ENCRYPTED]") {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.sendMail({
          from: emailUser,
          to: recipientEmail,
          subject: "Your BiteRush Verification Code",
          text: `Your OTP for email verification is ${emailOtp}. This code expires in 10 minutes.`,
        });
      } else {
        console.log(`[Dev Mode] OTP for ${recipientEmail}: ${emailOtp}`);
      }
    } else if (type === "phone") {
      const { otp: phoneOtp, expiresAt: phoneOtpExpiresAt } = CryptoService.generateOTP();
      const contactNumberLookupHmac = CryptoService.createPhoneLookupHmac(phone);

      // Find user by contact number lookup HMAC or plaintext
      const user = await User.findOne({
        $or: [{ contactNumberLookupHmac }, { contactNumber: phone }],
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      // Update the user with the new phone OTP atomically
      await User.updateOne(
        { _id: user._id },
        { $set: { phoneOtp, phoneOtpExpiresAt } }
      );

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
