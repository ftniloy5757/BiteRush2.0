import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";

// PUT update order status (accept/decline/prepare/assign rider)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, riderId, estimatedDeliveryMinutes } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    switch (action) {
      case "accept":
        order.status = "accepted";
        order.acceptedAt = new Date();
        if (estimatedDeliveryMinutes) {
          order.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
        }
        break;
      case "decline":
        order.status = "declined";
        break;
      case "preparing":
        order.status = "preparing";
        break;
      case "ready_for_pickup":
        order.status = "ready_for_pickup";
        break;
      case "assign_rider":
        if (!riderId) {
          return NextResponse.json({ message: "Rider ID required" }, { status: 400 });
        }
        order.rider = riderId;
        order.status = "out_for_delivery";
        order.dispatchedAt = new Date();
        break;
      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    await order.save();

    const updated = await Order.findById(id)
      .populate("user", "firstName lastName email contactNumber")
      .populate("rider", "firstName lastName contactNumber vehicleType");

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json({ message: error.message || "Error updating order" }, { status: 500 });
  }
}
