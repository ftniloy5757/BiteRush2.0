import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    email?: string;
    isEmailVerified?: boolean;
    role?: "user" | "admin" | "rider"; // Add role to User interface
  }

  interface Session {
    user: User & {
      id: string;
      firstName?: string;
      lastName?: string;
      contactNumber?: string;
      email?: string;
      isEmailVerified?: boolean;
      role?: "user" | "admin" | "rider"; // Add role to Session user
      profilePicture?: string; // Add this line
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    email?: string;
    isEmailVerified?: boolean;
    role?: "user" | "admin" | "rider"; // Add role to JWT
    profilePicture?: string;
  }
}
