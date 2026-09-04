// app/api/admin/orders/route.ts
import { NextResponse } from "next/server";

import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";
import connectDB from "@/lib/dbConnect";


export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    
    // Get all orders with basic user info
    const rawOrders = await Order.find({})
      .populate("user", "firstName lastName email firstNameEncrypted lastNameEncrypted emailEncrypted")
      .sort({ createdAt: -1 });

    const { CryptoService } = await import("@/lib/crypto/cryptoService");
    const orders = rawOrders.map((o) => {
      const obj = o.toObject();
      if (obj.user) {
        if (obj.user.firstNameEncrypted) {
          obj.user.firstName = CryptoService.decryptProfile(obj.user.firstNameEncrypted);
        }
        if (obj.user.lastNameEncrypted) {
          obj.user.lastName = CryptoService.decryptProfile(obj.user.lastNameEncrypted);
        }
        if (obj.user.emailEncrypted) {
          obj.user.email = CryptoService.decryptProfile(obj.user.emailEncrypted);
        }
      }
      return obj;
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { message: "Error fetching orders" },
      { status: 500 }
    );
  }
}