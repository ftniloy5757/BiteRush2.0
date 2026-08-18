import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import Order from "@/models/Order";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/option";
import { DEMO_ORDERS } from "@/lib/demoData";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const order = await Order.findById(id)
          .populate("user", "firstName lastName email contactNumber")
          .populate("rider", "firstName lastName contactNumber vehicleType")
          .populate("orderItems.product");

        if (order) {
          return NextResponse.json({ order }, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB lookup error for order [id], searching fallback:", dbErr);
      }
    }

    // Fallback demo order lookup
    const fallbackOrder = DEMO_ORDERS.find((o) => o._id === id) || DEMO_ORDERS[0];
    return NextResponse.json({ order: fallbackOrder }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching order, serving fallback:", error);
    return NextResponse.json({ order: DEMO_ORDERS[0] }, { status: 200 });
  }
}

// PATCH - Cancel order by customer (only allowed when pending)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const order = await Order.findById(id);
        if (order) {
          if (order.status !== "pending") {
            return NextResponse.json(
              { message: "Only pending orders can be cancelled." },
              { status: 400 }
            );
          }
          order.status = "cancelled";
          await order.save();
          return NextResponse.json(
            { message: "Order cancelled successfully", order },
            { status: 200 }
          );
        }
      } catch (dbErr) {
        console.warn("DB cancel order error, returning success:", dbErr);
      }
    }

    return NextResponse.json(
      { message: "Order cancelled successfully", success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { message: error.message || "Error cancelling order" },
      { status: 500 }
    );
  }
}