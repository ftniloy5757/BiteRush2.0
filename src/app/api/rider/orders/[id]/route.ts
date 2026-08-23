import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import { updateDynamicOrderStatus } from "@/lib/dynamicOrdersStore";

// PUT update delivery status by rider
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "rider") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action !== "delivered") {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    // Update dynamic store
    const dynamicUpdated = updateDynamicOrderStatus(id, "delivered");

    const conn = await connectDB();
    if (conn) {
      try {
        const order = await Order.findById(id);
        if (order) {
          order.status = "delivered";
          order.isDelivered = true;
          order.deliveredAt = new Date();
          if (order.paymentMethod === "Cash on Delivery") {
            order.isPaid = true;
            order.paidAt = new Date();
          }
          await order.save();
          return NextResponse.json(order, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB update delivery error, returning dynamic order:", dbErr);
      }
    }

    return NextResponse.json(dynamicUpdated || { _id: id, status: "delivered", isDelivered: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating delivery:", error);
    return NextResponse.json({ message: error.message || "Error updating delivery" }, { status: 500 });
  }
}
