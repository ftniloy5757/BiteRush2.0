import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";

// GET chat messages for an order
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await Order.findById(id).select("messages user rider status");
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Verify the user is either the customer or the assigned rider
    const userId = session.user.id;
    const isCustomer = order.user.toString() === userId;
    const isRider = order.rider?.toString() === userId;

    if (!isCustomer && !isRider) {
      return NextResponse.json({ message: "Not authorized for this order" }, { status: 403 });
    }

    return NextResponse.json({ messages: order.messages || [] }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching chat:", error);
    return NextResponse.json({ message: error.message || "Error fetching chat" }, { status: 500 });
  }
}

// POST send a chat message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ message: "Message text required" }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const userId = session.user.id;
    const isCustomer = order.user.toString() === userId;
    const isRider = order.rider?.toString() === userId;

    if (!isCustomer && !isRider) {
      return NextResponse.json({ message: "Not authorized for this order" }, { status: 403 });
    }

    const message = {
      senderRole: session.user.role as "customer" | "rider",
      senderName: `${session.user.firstName} ${session.user.lastName}`,
      text: text.trim(),
      createdAt: new Date(),
    };

    order.messages.push(message);
    await order.save();

    return NextResponse.json({ message, messages: order.messages }, { status: 201 });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json({ message: error.message || "Error sending message" }, { status: 500 });
  }
}
