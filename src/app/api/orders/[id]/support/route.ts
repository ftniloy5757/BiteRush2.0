import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";

// POST create support ticket (customer, 24h window)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { issueType, message } = await req.json();

    if (!issueType || !message) {
      return NextResponse.json({ message: "Issue type and message required" }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.user.toString() !== session.user.id) {
      return NextResponse.json({ message: "Not your order" }, { status: 403 });
    }

    if (order.status !== "delivered") {
      return NextResponse.json({ message: "Support only available for delivered orders" }, { status: 400 });
    }

    // Check 24-hour window
    const deliveredAt = new Date(order.deliveredAt!);
    const now = new Date();
    const hoursSinceDelivery = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceDelivery > 24) {
      return NextResponse.json({ message: "Support window has expired (24 hours after delivery)" }, { status: 400 });
    }

    const ticket = {
      issueType,
      message,
      status: "open" as const,
      createdAt: new Date(),
    };

    order.supportTickets.push(ticket);
    await order.save();

    return NextResponse.json({ success: true, ticket, order }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json({ message: error.message || "Error creating support ticket" }, { status: 500 });
  }
}

// GET support tickets for an order
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await Order.findById(id).select("supportTickets user deliveredAt status");
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ supportTickets: order.supportTickets || [], deliveredAt: order.deliveredAt }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json({ message: error.message || "Error fetching support tickets" }, { status: 500 });
  }
}
