import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import { getDynamicOrderById, addDynamicOrderMessage } from "@/lib/dynamicOrdersStore";

// GET chat messages for an order
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const conn = await connectDB();
    if (conn) {
      try {
        const order = await Order.findById(id).select("messages user rider status");
        if (order) {
          return NextResponse.json({ messages: order.messages || [] }, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB chat fetch error, falling back to dynamic store:", dbErr);
      }
    }

    const dynamicOrder = getDynamicOrderById(id);
    return NextResponse.json({ messages: dynamicOrder?.messages || [] }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching chat:", error);
    return NextResponse.json({ message: error.message || "Error fetching chat" }, { status: 500 });
  }
}

// POST send a chat message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ message: "Message text required" }, { status: 400 });
    }

    const message = {
      senderRole: session.user.role as "customer" | "rider",
      senderName: `${session.user.firstName || "User"} ${session.user.lastName || ""}`.trim(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    // Always update dynamic store for instant bidirectional sync
    addDynamicOrderMessage(id, message);

    const conn = await connectDB();
    if (conn) {
      try {
        const order = await Order.findById(id);
        if (order) {
          order.messages.push(message);
          await order.save();
          return NextResponse.json({ message, messages: order.messages }, { status: 201 });
        }
      } catch (dbErr) {
        console.warn("DB save chat message error, returning dynamic message:", dbErr);
      }
    }

    const dynamicOrder = getDynamicOrderById(id);
    return NextResponse.json({ message, messages: dynamicOrder?.messages || [message] }, { status: 201 });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json({ message: error.message || "Error sending message" }, { status: 500 });
  }
}
