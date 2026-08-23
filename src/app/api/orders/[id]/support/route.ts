// src/app/api/orders/[id]/support/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import { getDynamicOrderById, addDynamicOrderSupportTicket } from "@/lib/dynamicOrdersStore";
import { CryptoService } from "@/lib/crypto/cryptoService";

// POST create support ticket (customer)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { issueType, message } = await req.json();

    if (!issueType || !message) {
      return NextResponse.json({ message: "Issue type and message required" }, { status: 400 });
    }

    // Encrypt support message using Asymmetric ECC
    const messageEncrypted = CryptoService.encryptSupport(message.trim());

    const ticket = {
      issueType,
      message: message.trim(),
      messageEncrypted,
      status: "open" as const,
      createdAt: new Date(),
    };

    addDynamicOrderSupportTicket(id, ticket as any);

    const conn = await connectDB();
    if (conn) {
      try {
        const order = await Order.findById(id);
        if (order) {
          order.supportTickets.push(ticket as any);
          await order.save();
          return NextResponse.json({ success: true, ticket, order }, { status: 201 });
        }
      } catch (dbErr) {
        console.warn("DB save support ticket error, returning dynamic ticket:", dbErr);
      }
    }

    const dynamicOrder = getDynamicOrderById(id);
    return NextResponse.json({ success: true, ticket, order: dynamicOrder }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json({ message: error.message || "Error creating support ticket" }, { status: 500 });
  }
}

// GET support tickets for an order
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
        const order = await Order.findById(id).select("supportTickets user deliveredAt status");
        if (order) {
          const decryptedTickets = (order.supportTickets || []).map((t: any) => {
            const ticketObj = typeof t.toObject === "function" ? t.toObject() : { ...t };
            if (ticketObj.messageEncrypted) {
              ticketObj.message = CryptoService.decryptSupport(ticketObj.messageEncrypted);
            }
            if (ticketObj.responseEncrypted) {
              ticketObj.response = CryptoService.decryptSupport(ticketObj.responseEncrypted);
            }
            return ticketObj;
          });

          return NextResponse.json({ supportTickets: decryptedTickets, deliveredAt: order.deliveredAt }, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB fetch support tickets error, falling back to dynamic store:", dbErr);
      }
    }

    const dynamicOrder = getDynamicOrderById(id);
    return NextResponse.json({ supportTickets: dynamicOrder?.supportTickets || [], deliveredAt: dynamicOrder?.deliveredAt }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json({ message: error.message || "Error fetching support tickets" }, { status: 500 });
  }
}
