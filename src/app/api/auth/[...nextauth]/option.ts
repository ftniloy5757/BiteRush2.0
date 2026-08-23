import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
      },
      async authorize(credentials) {
        try {
          if (!credentials?.identifier || !credentials?.password) {
            return null;
          }

          const rawIdentifier = credentials.identifier.trim();
          const normalizedEmail = rawIdentifier.toLowerCase();
          const rawPassword = credentials.password;

          // Compute deterministic HMAC lookup tokens
          const emailLookupHmac = CryptoService.createEmailLookupHmac(normalizedEmail);
          const phoneLookupHmac = CryptoService.createPhoneLookupHmac(rawIdentifier);

          // 1. Try Authenticating against MongoDB database
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
                const isPasswordCorrect = await bcrypt.compare(
                  rawPassword,
                  user.passwordHash
                );

                if (isPasswordCorrect) {
                  // Transparently decrypt RSA-encrypted profile fields for the active session
                  const decryptedFirstName = user.firstNameEncrypted
                    ? CryptoService.decryptProfile(user.firstNameEncrypted)
                    : user.firstName;
                  const decryptedLastName = user.lastNameEncrypted
                    ? CryptoService.decryptProfile(user.lastNameEncrypted)
                    : user.lastName;
                  const decryptedEmail = user.emailEncrypted
                    ? CryptoService.decryptProfile(user.emailEncrypted)
                    : user.email;
                  const decryptedContact = user.contactNumberEncrypted
                    ? CryptoService.decryptProfile(user.contactNumberEncrypted)
                    : user.contactNumber || "";
                  const decryptedRestaurant = user.restaurantNameEncrypted
                    ? CryptoService.decryptProfile(user.restaurantNameEncrypted)
                    : user.restaurantName || "";
                  const decryptedVehicle = user.vehicleTypeEncrypted
                    ? CryptoService.decryptProfile(user.vehicleTypeEncrypted)
                    : user.vehicleType || "";

                  return {
                    id: user._id.toString(),
                    firstName: decryptedFirstName,
                    lastName: decryptedLastName,
                    contactNumber: decryptedContact,
                    email: decryptedEmail,
                    isEmailVerified: user.isEmailVerified !== false,
                    role: user.role || "customer",
                    restaurantName: decryptedRestaurant,
                    vehicleType: decryptedVehicle,
                  };
                }
              }
            }
          } catch (dbErr) {
            console.warn("DB authentication attempt failed, falling back to demo profiles:", dbErr);
          }

          // 2. Fallback Authentication for Pre-Configured Demo Test Accounts
          const matchedDemoUser = DEMO_USERS_FALLBACK.find(
            (u) =>
              (u.email.toLowerCase() === normalizedEmail || u.contactNumber === rawIdentifier) &&
              u.password === rawPassword
          );

          if (matchedDemoUser) {
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
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.email = token.email as string;
        session.user.isEmailVerified = token.isEmailVerified as boolean;
        session.user.contactNumber = token.contactNumber as string;
        session.user.role = token.role as "customer" | "restaurant" | "rider";
        session.user.profilePicture = token.profilePicture as string;
        session.user.restaurantName = token.restaurantName as string;
        session.user.vehicleType = token.vehicleType as string;
      }
      return session;
    },
  },
};
