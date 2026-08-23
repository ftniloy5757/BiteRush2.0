import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import Order from "@/models/Order";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../auth/[...nextauth]/option";
import { DEMO_IDS } from "@/lib/demoData";
import { getDynamicOrders, addDynamicOrder } from "@/lib/dynamicOrdersStore";

// GET user orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        let query: any = {};
        if (session.user.role === "customer") {
          query.user = session.user.id;
        } else if (session.user.role === "rider") {
          query.rider = session.user.id;
        }

        const orders = await Order.find(query)
          .populate("user", "firstName lastName email contactNumber")
          .populate("rider", "firstName lastName contactNumber vehicleType")
          .sort({ createdAt: -1 })
          .limit(limit);

        if (orders.length > 0) {
          return NextResponse.json({ orders }, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB query error in orders API, serving dynamic fallback:", dbErr);
      }
    }

    // Dynamic fallback orders
    let fallback = getDynamicOrders();
    if (session.user.role === "customer") {
      fallback = fallback.filter(
        (o) => o.user?._id === session.user.id || o.user?._id === DEMO_IDS.CUSTOMER
      );
    } else if (session.user.role === "rider") {
      fallback = fallback.filter(
        (o) => o.rider?._id === session.user.id || o.rider?._id === DEMO_IDS.RIDER
      );
    }

    return NextResponse.json({ orders: fallback.slice(0, limit) }, { status: 200 });
  } catch (error: any) {
    console.error("Error in orders API, serving fallback:", error);
    return NextResponse.json({ orders: getDynamicOrders() }, { status: 200 });
  }
}

// POST create new order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      deliveryMethod,
      deliveryInstructions,
      itemsPrice,
      shippingPrice,
      tipAmount,
      totalPrice,
    } = body;

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ message: "No order items" }, { status: 400 });
    }

    const dynamicCreated = addDynamicOrder({
      user: {
        _id: session.user.id || DEMO_IDS.CUSTOMER,
        firstName: session.user.firstName || "Niloy",
        lastName: session.user.lastName || "Farhan",
        email: session.user.email || "customer@biterush.com",
        contactNumber: session.user.contactNumber || "+8801700000001",
      },
      orderItems,
      shippingAddress,
      paymentMethod,
      deliveryMethod,
      deliveryInstructions,
      itemsPrice,
      shippingPrice,
      tipAmount: tipAmount || 0,
      totalPrice,
      status: "pending",
    });

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const order = new Order({
          user: session.user.id,
          orderItems,
          shippingAddress,
          paymentMethod,
          deliveryMethod,
          deliveryInstructions,
          itemsPrice,
          shippingPrice,
          tipAmount: tipAmount || 0,
          totalPrice,
          status: "pending",
          isPaid: paymentMethod === "Bkash" || paymentMethod === "Card or Debit Card",
          paidAt:
            paymentMethod === "Bkash" || paymentMethod === "Card or Debit Card"
              ? new Date()
              : undefined,
        });

        const createdOrder = await order.save();
        return NextResponse.json({ order: createdOrder }, { status: 201 });
      } catch (dbErr) {
        console.warn("DB save order error, returning dynamic order:", dbErr);
      }
    }

    return NextResponse.json({ order: dynamicCreated }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { message: error.message || "Error creating order" },
      { status: 500 }
    );
  }
}
