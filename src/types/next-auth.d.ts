import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    email?: string;
    isEmailVerified?: boolean;
    role?: "customer" | "restaurant" | "rider";
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
      role?: "customer" | "restaurant" | "rider";
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
    role?: "customer" | "restaurant" | "rider";
    profilePicture?: string;
    restaurantName?: string;
    vehicleType?: string;
  }
}
