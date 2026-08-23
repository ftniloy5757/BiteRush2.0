import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    email?: string;
    isEmailVerified?: boolean;
    role?: "customer" | "restaurant" | "rider" | "admin";
    restaurantName?: string;
    vehicleType?: string;
  }

  interface Session {
    user: User & {
      id: string;
      firstName?: string;
      lastName?: string;
      contactNumber?: string;
      email?: string;
      isEmailVerified?: boolean;
      role?: "customer" | "restaurant" | "rider" | "admin";
      profilePicture?: string;
      restaurantName?: string;
      vehicleType?: string;
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
    role?: "customer" | "restaurant" | "rider" | "admin";
    profilePicture?: string;
    restaurantName?: string;
    vehicleType?: string;
  }
}
