// app/api/auth/[...nextauth]/options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User"; // Using your Mongoose User model
import connectDB from "@/lib/dbConnect";

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
            throw new Error("Missing identifier or password");
          }

          // Connect to the database
          await connectDB();

          // Find user by email or contact number
          let user = await User.findOne({
            $or: [
              { email: credentials.identifier },
              { contactNumber: credentials.identifier },
            ],
          });

          if (!user) {
            const { seedDemoData } = await import("@/lib/seedDemoUsers");
            await seedDemoData();
            user = await User.findOne({
              $or: [
                { email: credentials.identifier },
                { contactNumber: credentials.identifier },
              ],
            });
          }

          if (!user) {
            throw new Error("User not found");
          }

          // Compare the provided password with the stored password hash
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordCorrect) {
            throw new Error("Invalid credentials");
          }

          if (!user.isEmailVerified) {
            throw new Error("User account is not verified");
          }

          // Return user data for NextAuth including role
          return {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            contactNumber: user.contactNumber || "",
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            role: user.role, // Include the user's role
            restaurantName: user.restaurantName || "",
            vehicleType: user.vehicleType || "",
          };
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
  secret: process.env.NEXTAUTH_SECRET,
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
