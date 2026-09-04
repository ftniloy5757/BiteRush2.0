// src/models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  // Plaintext/Decrypted view fields
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  bio?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  vehicleType?: string;

  // Asymmetric Encrypted PII Fields (RSA)
  firstNameEncrypted?: string;
  lastNameEncrypted?: string;
  emailEncrypted?: string;
  contactNumberEncrypted?: string;
  bioEncrypted?: string;
  restaurantNameEncrypted?: string;
  restaurantAddressEncrypted?: string;
  vehicleTypeEncrypted?: string;

  // Blind Lookup HMAC Indexes (HMAC-SHA256)
  emailLookupHmac?: string;
  contactNumberLookupHmac?: string;

  // Operational & Authentication Fields (Plaintext)
  role: "customer" | "restaurant" | "rider" | "admin";
  passwordHash: string;
  profilePicture?: string;
  themePreference: "light" | "dark";
  status: "Online" | "Away" | "Busy";
  activeStatus?: boolean;

  // Two-Step Authentication & Verification
  phoneOtp?: string;
  phoneOtpExpiresAt?: Date;
  isPhoneVerified: boolean;
  emailOtp?: string;
  emailOtpExpiresAt?: Date;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  isTwoFactorVerified: boolean;
  twoFactorOtp?: string;
  twoFactorOtpExpiresAt?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;

  // Cryptographic Versioning & Integrity
  cryptoVersion: number;
  integrityMac?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, default: "[ENCRYPTED]" },
    lastName: { type: String, default: "[ENCRYPTED]" },
    email: { type: String, default: "[ENCRYPTED]" },
    role: {
      type: String,
      enum: ["customer", "restaurant", "rider", "admin"],
      default: "customer",
    },
    passwordHash: { type: String, required: true },
    bio: String,
    profilePicture: String,
    contactNumber: { type: String, default: "[ENCRYPTED]", sparse: true },
    themePreference: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    status: {
      type: String,
      enum: ["Online", "Away", "Busy"],
      default: "Online",
    },

    // RSA Encrypted PII
    firstNameEncrypted: String,
    lastNameEncrypted: String,
    emailEncrypted: String,
    contactNumberEncrypted: String,
    bioEncrypted: String,
    restaurantNameEncrypted: String,
    restaurantAddressEncrypted: String,
    vehicleTypeEncrypted: String,

    // Deterministic HMAC Lookup Tokens
    emailLookupHmac: { type: String, index: true },
    contactNumberLookupHmac: { type: String, index: true, sparse: true },

    // OTP & 2FA
    phoneOtp: String,
    phoneOtpExpiresAt: Date,
    isPhoneVerified: { type: Boolean, default: false },
    emailOtp: String,
    emailOtpExpiresAt: Date,
    isEmailVerified: { type: Boolean, default: false },
    isTwoFactorEnabled: { type: Boolean, default: false },
    isTwoFactorVerified: { type: Boolean, default: false },
    twoFactorOtp: String,
    twoFactorOtpExpiresAt: Date,
    resetToken: String,
    resetTokenExpiry: Date,

    // Restaurant-specific fields
    restaurantName: String,
    restaurantAddress: String,

    // Rider-specific fields
    vehicleType: String,
    activeStatus: { type: Boolean, default: true },

    // Cryptographic metadata
    cryptoVersion: { type: Number, default: 1 },
    integrityMac: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
