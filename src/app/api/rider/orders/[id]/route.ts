import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";

// PUT update delivery status by rider
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "rider") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.rider?.toString() !== session.user.id) {
      return NextResponse.json({ message: "Not assigned to this order" }, { status: 403 });
    }

    switch (action) {
      case "delivered":
        order.status = "delivered";
        order.isDelivered = true;
        order.deliveredAt = new Date();
        if (order.paymentMethod === "Cash on Delivery") {
          order.isPaid = true;
          order.paidAt = new Date();
        }
        break;
      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    await order.save();
    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error("Error updating delivery:", error);
    return NextResponse.json({ message: error.message || "Error updating delivery" }, { status: 500 });
  }
}
