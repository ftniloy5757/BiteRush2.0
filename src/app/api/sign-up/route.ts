import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import User from "@/models/User"; // Using your Mongoose User model
import connectDB from "@/lib/dbConnect";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_NAME,
    pass: process.env.EMAIL_PASS,
  },
});

export const POST = async (request: Request) => {
  const body = await request.json();
  const { firstName, lastName, email, password, contactNumber } = body;
  const normalizedemail = email.toLowerCase();

  // Password is hashed using bcrypt and the salt is 10 for better security
  const passwordHash = await bcrypt.hash(password, 10);
  const emailOtp = crypto.randomInt(100000, 999999).toString();
  const emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  try {
    // Connect to the database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedemail });
    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, message: "Email already in use" }),
        { status: 409 }
      );
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email: normalizedemail,
      passwordHash,
      contactNumber,
      emailOtp,
      emailOtpExpiresAt,
      isEmailVerified: false,
    });

    // Save the user to the database
    await newUser.save();

    // Attempt sending verification email safely
    try {
      if (process.env.EMAIL_NAME && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: process.env.EMAIL_NAME,
          to: normalizedemail,
          subject: "Verify your email",
          text: `Your verification code is: ${emailOtp}`,
        });
      } else {
        console.log(`[Dev Mode] Verification OTP for ${normalizedemail}: ${emailOtp}`);
      }
    } catch (mailError) {
      console.error("Verification email sending failed:", mailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser._id,
        message:
          "User registered successfully. A verification code has been sent to your email.",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to register user" }),
      { status: 500 }
    );
  }
};
