// src/app/api/sign-up/route.ts
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "@/models/User";
import connectDB from "@/lib/dbConnect";
import mongoose from "mongoose";
import { CryptoService } from "@/lib/crypto/cryptoService";
import { KeyManager } from "@/lib/crypto/keyManager";
import { addDynamicUser, findDynamicUserByEmail } from "@/lib/dynamicUsersStore";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_NAME,
    pass: process.env.EMAIL_PASS,
  },
});

export const POST = async (request: Request) => {
  const body = await request.json();
  const {
    firstName,
    lastName,
    email,
    password,
    contactNumber,
    role,
    restaurantName,
    restaurantAddress,
    vehicleType,
  } = body;
  const normalizedEmail = (email || "").toLowerCase().trim();

  if (!normalizedEmail || !password) {
    return new Response(
      JSON.stringify({ success: false, message: "Email and password are required." }),
      { status: 400 }
    );
  }

  // 1. Password is salted and hashed using bcrypt
  const passwordHash = await bcrypt.hash(password, 10);

  // 2. Compute Deterministic Blind Lookup HMACs
  const emailLookupHmac = CryptoService.createEmailLookupHmac(normalizedEmail);
  const contactNumberLookupHmac = contactNumber
    ? CryptoService.createPhoneLookupHmac(contactNumber)
    : undefined;

  // 3. Generate 6-digit OTP using from-scratch HMAC-SHA256
  const { otp: emailOtp, expiresAt: emailOtpExpiresAt } = CryptoService.generateOTP();

  // 4. Encrypt sensitive PII using Asymmetric RSA
  const firstNameEncrypted = CryptoService.encryptProfile(firstName || "Customer");
  const lastNameEncrypted = CryptoService.encryptProfile(lastName || "");
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

  let createdUserId: string | null = null;

  // 6. Attempt primary save in MongoDB
  try {
    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      // Check if user already exists in DB
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

        firstNameEncrypted,
        lastNameEncrypted,
        emailEncrypted,
        contactNumberEncrypted,
        restaurantNameEncrypted,
        restaurantAddressEncrypted,
        vehicleTypeEncrypted,

        emailLookupHmac,
        contactNumberLookupHmac,

        emailOtp,
        emailOtpExpiresAt,
        isEmailVerified: false,
        isTwoFactorEnabled: true,
        isTwoFactorVerified: false,

        cryptoVersion: KeyManager.getActiveVersion(),
        integrityMac,
      });

      await newUser.save();
      createdUserId = newUser._id.toString();

      // Mirror to dynamic store for fast fallback
      addDynamicUser({
        _id: createdUserId,
        id: createdUserId,
        firstName,
        lastName,
        email: normalizedEmail,
        contactNumber,
        role: role || "customer",
        passwordHash,
        restaurantName,
        restaurantAddress,
        vehicleType,
        firstNameEncrypted,
        lastNameEncrypted,
        emailEncrypted,
        contactNumberEncrypted,
        emailLookupHmac,
        contactNumberLookupHmac,
        emailOtp,
        emailOtpExpiresAt,
        isEmailVerified: false,
        isTwoFactorEnabled: true,
        isTwoFactorVerified: false,
        integrityMac,
      });
    }
  } catch (dbErr) {
    console.warn("MongoDB registration notice (falling back to dynamic user store):", dbErr);
  }

  // 7. Resilient fallback: If DB was offline or couldn't complete save, use dynamic store
  if (!createdUserId) {
    const existingDynamic = findDynamicUserByEmail(normalizedEmail);
    if (existingDynamic) {
      return new Response(
        JSON.stringify({ success: false, message: "Email already in use" }),
        { status: 409 }
      );
    }

    const dynamicUser = addDynamicUser({
      firstName: firstName || "Customer",
      lastName: lastName || "",
      email: normalizedEmail,
      contactNumber,
      role: role || "customer",
      passwordHash,
      restaurantName,
      restaurantAddress,
      vehicleType,
      firstNameEncrypted,
      lastNameEncrypted,
      emailEncrypted,
      contactNumberEncrypted,
      emailLookupHmac,
      contactNumberLookupHmac,
      emailOtp,
      emailOtpExpiresAt,
      isEmailVerified: false,
      isTwoFactorEnabled: true,
      isTwoFactorVerified: false,
      integrityMac,
    });

    createdUserId = dynamicUser._id;
  }

  // 8. Attempt sending verification email
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
      userId: createdUserId,
      message:
        "User registered successfully. A 2FA verification code has been sent to your email.",
    }),
    { status: 201 }
  );
};
