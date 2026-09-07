import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import { getDynamicOrders } from "@/lib/dynamicOrdersStore";

import { decryptOrderPayload } from "@/lib/crypto/orderDecryptor";

// GET all orders for restaurant
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const rawOrders = await Order.find()
          .populate("user", "firstName lastName email contactNumber firstNameEncrypted lastNameEncrypted emailEncrypted contactNumberEncrypted")
          .populate("rider", "firstName lastName contactNumber vehicleType firstNameEncrypted lastNameEncrypted contactNumberEncrypted vehicleTypeEncrypted")
          .sort({ createdAt: -1 });

        if (rawOrders.length > 0) {
          const decryptedOrders = rawOrders.map((ord) => decryptOrderPayload(ord));
          return NextResponse.json(decryptedOrders, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB query error in restaurant orders, serving dynamic store:", dbErr);
      }
    }

    const dynamicOrders = getDynamicOrders().map((ord) => decryptOrderPayload(ord));
    return NextResponse.json(dynamicOrders, { status: 200 });
  } catch (error) {
    console.error("Error fetching restaurant orders, serving fallback:", error);
    const dynamicOrders = getDynamicOrders().map((ord) => decryptOrderPayload(ord));
    return NextResponse.json(dynamicOrders, { status: 200 });
  }
}
