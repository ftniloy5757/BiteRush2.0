// src/app/api/orders/[id]/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import { getDynamicOrderById, addDynamicOrderMessage } from "@/lib/dynamicOrdersStore";
import { CryptoService } from "@/lib/crypto/cryptoService";

// GET chat messages for an order
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const conn = await connectDB();
    if (conn) {
      try {
        const order = await Order.findById(id).select("messages user rider status");
        if (order) {
          // RBAC Authorization Check: Customer, assigned Rider, or Restaurant
          const userId = session.user.id;
          const isCustomer = order.user?.toString() === userId;
          const isRider = order.rider?.toString() === userId;
          const isRestaurant = session.user.role === "restaurant" || session.user.role === "admin";

          if (!isCustomer && !isRider && !isRestaurant) {
            return NextResponse.json({ message: "Not authorized for this order" }, { status: 403 });
          }

          // Decrypt ECC encrypted chat messages
          const decryptedMessages = (order.messages || []).map((m: any) => {
            const msgObj = typeof m.toObject === "function" ? m.toObject() : { ...m };
            if (msgObj.textEncrypted) {
              msgObj.text = CryptoService.decryptChat(msgObj.textEncrypted);
            }
            return msgObj;
          });

          return NextResponse.json({ messages: decryptedMessages }, { status: 200 });
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
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ message: "Message text required" }, { status: 400 });
    }

    // Encrypt message text using Asymmetric ECC
    const textEncrypted = CryptoService.encryptChat(text.trim());

    // Message with masked text for database storage
    const dbMessage = {
      senderRole: session.user.role as "customer" | "rider",
      senderName: `${session.user.firstName || "User"} ${session.user.lastName || ""}`.trim(),
      text: "[ENCRYPTED]",
      textEncrypted,
      createdAt: new Date(),
    };

    // Client-facing message with plaintext text
    const clientMessage = {
      ...dbMessage,
      text: text.trim(),
    };

    // Update dynamic store
    addDynamicOrderMessage(id, clientMessage as any);

    const conn = await connectDB();
    if (conn) {
      try {
        const order = await Order.findById(id);
        if (order) {
          order.messages.push(dbMessage as any);
          await order.save();
          return NextResponse.json({ message: clientMessage }, { status: 201 });
        }
      } catch (dbErr) {
        console.warn("DB save chat message error, returning dynamic message:", dbErr);
      }
    }

    const dynamicOrder = getDynamicOrderById(id);
    return NextResponse.json({ message: clientMessage, messages: dynamicOrder?.messages || [clientMessage] }, { status: 201 });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json({ message: error.message || "Error sending message" }, { status: 500 });
  }
}
