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
    
    // Get all orders with full decrypted user and rider info
    const rawOrders = await Order.find({})
      .populate("user", "firstName lastName email contactNumber firstNameEncrypted lastNameEncrypted emailEncrypted contactNumberEncrypted")
      .populate("rider", "firstName lastName contactNumber vehicleType firstNameEncrypted lastNameEncrypted contactNumberEncrypted vehicleTypeEncrypted")
      .sort({ createdAt: -1 });

    const { decryptOrderPayload } = await import("@/lib/crypto/orderDecryptor");
    const orders = rawOrders.map((o) => decryptOrderPayload(o));
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { message: "Error fetching orders" },
      { status: 500 }
    );
  }
}