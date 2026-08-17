// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Order from "@/models/Order";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/option";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const order = await Order.findById(id)
      .populate("user", "firstName lastName email contactNumber")
      .populate("rider", "firstName lastName contactNumber vehicleType")
      .populate("orderItems.product");

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    // Check authorization: customer must own the order, rider assigned to it, or restaurant role
    const isOwner = order.user._id?.toString() === session.user.id || order.user.toString() === session.user.id;
    const isAssignedRider = order.rider?._id?.toString() === session.user.id || order.rider?.toString() === session.user.id;
    const isRestaurant = session.user.role === "restaurant";

    if (!isOwner && !isAssignedRider && !isRestaurant) {
      return NextResponse.json(
        { message: "Not authorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { message: error.message || "Error fetching order" },
      { status: 500 }
    );
  }
}

// PATCH - Cancel order by customer (only allowed when pending)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { action } = await req.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    const isOwner = order.user.toString() === session.user.id;
    if (!isOwner) {
      return NextResponse.json(
        { message: "Only the order owner can cancel this order" },
        { status: 403 }
      );
    }

    if (action === "cancel") {
      if (order.status !== "pending") {
        return NextResponse.json(
          { message: "Orders can only be cancelled while status is pending" },
          { status: 400 }
        );
      }

      order.status = "cancelled";
      await order.save();

      return NextResponse.json({
        success: true,
        message: "Order cancelled successfully",
        order,
      });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { message: error.message || "Error cancelling order" },
      { status: 500 }
    );
  }
}