import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import { getDynamicOrders } from "@/lib/dynamicOrdersStore";

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
        const orders = await Order.find()
          .populate("user", "firstName lastName email contactNumber")
          .populate("rider", "firstName lastName contactNumber vehicleType")
          .sort({ createdAt: -1 });

        if (orders.length > 0) {
          return NextResponse.json(orders, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB query error in restaurant orders, serving dynamic store:", dbErr);
      }
    }

    return NextResponse.json(getDynamicOrders(), { status: 200 });
  } catch (error) {
    console.error("Error fetching restaurant orders, serving fallback:", error);
    return NextResponse.json(getDynamicOrders(), { status: 200 });
  }
}
