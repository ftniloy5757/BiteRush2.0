import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "@/models/User";
import connectDB from "@/lib/dbConnect";
import { DEMO_USERS } from "@/lib/demoData";
import { CryptoService } from "@/lib/crypto/cryptoService";

const DEMO_USERS_FALLBACK = DEMO_USERS;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Contact Number", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "2FA Verification Code", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.identifier || !credentials?.password) {
            return null;
          }

          // Two-Step Authentication: OTP is REQUIRED for login
          if (!credentials?.otp) {
            return null;
          }

          const rawIdentifier = credentials.identifier.trim();

          // Reject non-email logins: phone number login is strictly prohibited
          if (!rawIdentifier.includes("@") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawIdentifier)) {
            return null;
          }

          const normalizedEmail = rawIdentifier.toLowerCase();
          const rawPassword = credentials.password;
          const inputOtp = credentials.otp.trim();

          // Compute deterministic HMAC lookup tokens
          const emailLookupHmac = CryptoService.createEmailLookupHmac(normalizedEmail);

          // 1. Try Authenticating against MongoDB database
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
                const isPasswordCorrect = await bcrypt.compare(
                  rawPassword,
                  user.passwordHash
                );

                if (isPasswordCorrect) {
                  // Step 2: Verify Two-Factor Authentication OTP
                  // Strict Security: 123456 is ONLY allowed for dedicated testing profiles
                  const isDedicatedDemo = [
                    "customer@biterush.com",
                    "restaurant@biterush.com",
                    "rider@biterush.com",
                    "admin@biterush.com",
                  ].includes(normalizedEmail);

                  const isOtpValid =
                    (isDedicatedDemo && inputOtp === "123456") ||
                    CryptoService.verifyOTP(
                      inputOtp,
                      user.twoFactorOtp,
                      user.twoFactorOtpExpiresAt
                    );

                  if (!isOtpValid) {
                    return null; // Reject: invalid or expired OTP
                  }

                  // Clear OTP to prevent replay attacks atomically
                  await User.updateOne(
                    { _id: user._id },
                    {
                      $unset: { twoFactorOtp: 1, twoFactorOtpExpiresAt: 1 },
                      $set: { isTwoFactorVerified: true },
                    }
                  );

                  const { decryptUserPayload } = await import("@/lib/crypto/orderDecryptor");
                  const decrypted = decryptUserPayload(user);

                  return {
                    id: user._id.toString(),
                    firstName: decrypted.firstName,
                    lastName: decrypted.lastName,
                    contactNumber: decrypted.contactNumber,
                    email: decrypted.email || normalizedEmail,
                    isEmailVerified: user.isEmailVerified !== false,
                    role: user.role || "customer",
                    restaurantName: decrypted.restaurantName,
                    vehicleType: decrypted.vehicleType,
                  };
                }
              }
            }
          } catch (dbErr) {
            console.warn("DB authentication attempt failed, falling back to dynamic / demo profiles:", dbErr);
          }

          // 2. Check Dynamic Users Store (resilient offline / serverless registration fallback)
          try {
            const { findDynamicUserByEmail } = await import("@/lib/dynamicUsersStore");
            const dynamicUser = findDynamicUserByEmail(normalizedEmail);
            if (dynamicUser) {
              const isPasswordCorrect = await bcrypt.compare(rawPassword, dynamicUser.passwordHash);
              if (isPasswordCorrect) {
                const isDedicatedDemo = [
                  "customer@biterush.com",
                  "restaurant@biterush.com",
                  "rider@biterush.com",
                  "admin@biterush.com",
                ].includes(normalizedEmail);

                const isOtpValid =
                  (isDedicatedDemo && inputOtp === "123456") ||
                  CryptoService.verifyOTP(
                    inputOtp,
                    dynamicUser.twoFactorOtp,
                    dynamicUser.twoFactorOtpExpiresAt
                  );

                if (isOtpValid) {
                  // Ensure this user is persisted into MongoDB Atlas so they become permanent
                  try {
                    await connectDB();
                    const existingInDb = await User.findOne({
                      $or: [{ emailLookupHmac: dynamicUser.emailLookupHmac }, { email: normalizedEmail }],
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
                        emailLookupHmac: dynamicUser.emailLookupHmac,
                        contactNumberLookupHmac: dynamicUser.contactNumberLookupHmac,
                        isEmailVerified: true,
                        isTwoFactorEnabled: true,
                        isTwoFactorVerified: true,
                        cryptoVersion: 1,
                        integrityMac: dynamicUser.integrityMac,
                      });
                      await newUser.save();
                    }
                  } catch (syncErr) {
                    console.warn("Sync dynamic user to MongoDB notice:", syncErr);
                  }

                  const { decryptUserPayload } = await import("@/lib/crypto/orderDecryptor");
                  const decryptedDyn = decryptUserPayload(dynamicUser);

                  return {
                    id: dynamicUser._id,
                    firstName: decryptedDyn.firstName || "Customer",
                    lastName: decryptedDyn.lastName || "",
                    contactNumber: decryptedDyn.contactNumber || "",
                    email: decryptedDyn.email || normalizedEmail,
                    isEmailVerified: true,
                    role: dynamicUser.role || "customer",
                    restaurantName: decryptedDyn.restaurantName,
                    vehicleType: decryptedDyn.vehicleType,
                  };
                }
              }
            }
          } catch (dynErr) {
            console.warn("Dynamic user auth check error:", dynErr);
          }

          // 3. Fallback Authentication strictly for Dedicated Demo Test Accounts
          const DEDICATED_TESTING_EMAILS = [
            "customer@biterush.com",
            "restaurant@biterush.com",
            "rider@biterush.com",
            "admin@biterush.com",
          ];

          if (DEDICATED_TESTING_EMAILS.includes(normalizedEmail)) {
            const matchedDemoUser = DEMO_USERS_FALLBACK.find(
              (u) =>
                u.email.toLowerCase() === normalizedEmail &&
                u.password === rawPassword
            );

            if (matchedDemoUser) {
              // Demo code is strictly 123456 or DB-generated OTP
              let isOtpValid = inputOtp === "123456";

              if (!isOtpValid) {
                try {
                  const conn = await connectDB();
                  if (conn) {
                    const demoDbUser = await User.findOne({
                      $or: [
                        { emailLookupHmac },
                        { email: matchedDemoUser.email },
                      ],
                    });
                    if (demoDbUser && demoDbUser.twoFactorOtp) {
                      isOtpValid = CryptoService.verifyOTP(
                        inputOtp,
                        demoDbUser.twoFactorOtp,
                        demoDbUser.twoFactorOtpExpiresAt
                      );
                      if (isOtpValid) {
                        demoDbUser.twoFactorOtp = undefined;
                        demoDbUser.twoFactorOtpExpiresAt = undefined;
                        demoDbUser.isTwoFactorVerified = true;
                        await demoDbUser.save();
                      }
                    }
                  }
                } catch {
                  // Fallback
                }
              }

              if (!isOtpValid) {
                return null;
              }

              return {
                id: matchedDemoUser.id,
                firstName: matchedDemoUser.firstName,
                lastName: matchedDemoUser.lastName,
                contactNumber: matchedDemoUser.contactNumber,
                email: matchedDemoUser.email,
                isEmailVerified: true,
                role: matchedDemoUser.role,
                restaurantName: matchedDemoUser.restaurantName,
                vehicleType: matchedDemoUser.vehicleType,
              };
            }
          }

          return null;
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "biterush_super_secure_nextauth_secret_key_2026",
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          contactNumber: user.contactNumber,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
          restaurantName: user.restaurantName,
          vehicleType: user.vehicleType,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const { sanitizeField } = await import("@/lib/crypto/orderDecryptor");
        const cleanFirst = sanitizeField(token.firstName);
        const cleanLast = sanitizeField(token.lastName);
        const cleanEmail = sanitizeField(token.email) || (token.email as string);
        const cleanContact = sanitizeField(token.contactNumber) || (token.contactNumber as string);
        const cleanRestaurant = sanitizeField(token.restaurantName) || (token.restaurantName as string);
        const cleanVehicle = sanitizeField(token.vehicleType) || (token.vehicleType as string);

        session.user.id = token.id as string;
        session.user.firstName = cleanFirst || (token.role === "rider" ? "Zayed" : token.role === "restaurant" ? "BiteRush" : token.role === "admin" ? "Admin" : "Customer");
        session.user.lastName = cleanLast;
        session.user.email = cleanEmail;
        session.user.isEmailVerified = token.isEmailVerified as boolean;
        session.user.contactNumber = cleanContact;
        session.user.role = token.role as "customer" | "restaurant" | "rider" | "admin";
        session.user.profilePicture = token.profilePicture as string;
        session.user.restaurantName = cleanRestaurant;
        session.user.vehicleType = cleanVehicle;
      }
      return session;
    },
  },
};
