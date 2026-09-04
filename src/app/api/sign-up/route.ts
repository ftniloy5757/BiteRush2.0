// src/app/api/sign-up/route.ts
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "@/models/User";
import connectDB from "@/lib/dbConnect";
import { CryptoService } from "@/lib/crypto/cryptoService";
import { KeyManager } from "@/lib/crypto/keyManager";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_NAME,
    pass: process.env.EMAIL_PASS,
  },
});

export const POST = async (request: Request) => {
  const body = await request.json();
  const { firstName, lastName, email, password, contactNumber, role, restaurantName, restaurantAddress, vehicleType } = body;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Password is salted and hashed using bcrypt
  const passwordHash = await bcrypt.hash(password, 10);

  // 2. Compute Deterministic Blind Lookup HMACs
  const emailLookupHmac = CryptoService.createEmailLookupHmac(normalizedEmail);
  const contactNumberLookupHmac = contactNumber
    ? CryptoService.createPhoneLookupHmac(contactNumber)
    : undefined;

  // 3. Generate 6-digit OTP using from-scratch HMAC-SHA256
  const { otp: emailOtp, expiresAt: emailOtpExpiresAt } = CryptoService.generateOTP();

  try {
    await connectDB();

    // Check if user already exists via blind HMAC index
    const existingUser = await User.findOne({
      $or: [
        { emailLookupHmac },
        { email: normalizedEmail },
        ...(contactNumberLookupHmac ? [{ contactNumberLookupHmac }] : []),
      ],
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, message: "Email or phone number already in use" }),
        { status: 409 }
      );
    }

    // 4. Encrypt sensitive PII using Asymmetric RSA
    const firstNameEncrypted = CryptoService.encryptProfile(firstName);
    const lastNameEncrypted = CryptoService.encryptProfile(lastName);
    const emailEncrypted = CryptoService.encryptProfile(normalizedEmail);
    const contactNumberEncrypted = contactNumber
      ? CryptoService.encryptProfile(contactNumber)
      : undefined;
    const restaurantNameEncrypted = restaurantName
      ? CryptoService.encryptProfile(restaurantName)
      : undefined;
    const restaurantAddressEncrypted = restaurantAddress
      ? CryptoService.encryptProfile(restaurantAddress)
      : undefined;
    const vehicleTypeEncrypted = vehicleType
      ? CryptoService.encryptProfile(vehicleType)
      : undefined;

    // 5. Generate HMAC Data Integrity MAC
    const integrityMac = CryptoService.generateIntegrityMac({
      emailLookupHmac,
      contactNumberLookupHmac,
      role: role || "customer",
    });

    // 6. Create new user with encrypted PII and blind lookup indexes
    // Plaintext fields store masked placeholders to prevent PII compromise
    const newUser = new User({
      firstName: "[ENCRYPTED]",
      lastName: "[ENCRYPTED]",
      email: "[ENCRYPTED]",
      contactNumber: "[ENCRYPTED]",
      role: role || "customer",
      passwordHash,
      restaurantName: restaurantName ? "[ENCRYPTED]" : undefined,
      restaurantAddress: restaurantAddress ? "[ENCRYPTED]" : undefined,
      vehicleType: vehicleType ? "[ENCRYPTED]" : undefined,

      // RSA Encrypted fields
      firstNameEncrypted,
      lastNameEncrypted,
      emailEncrypted,
      contactNumberEncrypted,
      restaurantNameEncrypted,
      restaurantAddressEncrypted,
      vehicleTypeEncrypted,

      // HMAC Lookup Indexes
      emailLookupHmac,
      contactNumberLookupHmac,

      // 2FA / Verification
      emailOtp,
      emailOtpExpiresAt,
      isEmailVerified: false,
      isTwoFactorEnabled: true,
      isTwoFactorVerified: false,

      // Cryptographic metadata
      cryptoVersion: KeyManager.getActiveVersion(),
      integrityMac,
    });

    await newUser.save();

    // Attempt sending verification email
    try {
      if (process.env.EMAIL_NAME && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: process.env.EMAIL_NAME,
          to: normalizedEmail,
          subject: "Verify your BiteRush account (2FA Code)",
          text: `Your BiteRush verification code is: ${emailOtp}. This code expires in 10 minutes.`,
        });
      } else {
        console.log(`[Dev Mode] 2FA Verification OTP for ${normalizedEmail}: ${emailOtp}`);
      }
    } catch (mailError) {
      console.error("Verification email sending failed:", mailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser._id,
        message:
          "User registered successfully. A 2FA verification code has been sent to your email.",
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Failed to register user" }),
      { status: 500 }
    );
  }
};
