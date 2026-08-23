import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import { DEMO_IDS } from "@/lib/demoData";
import { getDynamicOrders } from "@/lib/dynamicOrdersStore";

// GET assigned deliveries for rider
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "rider") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const orders = await Order.find({ rider: session.user.id })
          .populate("user", "firstName lastName email contactNumber")
          .sort({ createdAt: -1 });

        if (orders.length > 0) {
          return NextResponse.json(orders, { status: 200 });
        }
      } catch (err) {
        console.warn("DB rider orders lookup error, serving dynamic store:", err);
      }
    }

    // Dynamic store filter for rider
    const allOrders = getDynamicOrders();
    const riderFallbackOrders = allOrders.filter(
      (o: any) =>
        o.rider?._id === session.user.id ||
        o.rider?._id === DEMO_IDS.RIDER ||
        o.status === "out_for_delivery" ||
        (o.status === "delivered" && o.rider)
    );

    return NextResponse.json(riderFallbackOrders, { status: 200 });
  } catch (error) {
    console.error("Error fetching rider orders:", error);
    const allOrders = getDynamicOrders();
    const riderFallbackOrders = allOrders.filter((o: any) => o.rider?._id === DEMO_IDS.RIDER);
    return NextResponse.json(riderFallbackOrders, { status: 200 });
  }
}
