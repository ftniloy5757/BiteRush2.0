// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Order from "@/models/Order";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../auth/[...nextauth]/option";

// GET user orders
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

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

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { message: error.message || "Error fetching orders" },
      { status: 500 }
    );
  }
}

// POST create new order
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const {
      orderItems,
      shippingAddress,
      customerAddress,
      deliveryInstructions,
      paymentMethod,
      deliveryMethod,
      itemsPrice,
      subtotal,
      shippingPrice,
      tip,
      tipAmount,
      totalPrice,
      total,
    } = data;

    // Validate required fields
    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { message: "No order items in request" },
        { status: 400 }
      );
    }

    // Format shipping address
    const addressObj = shippingAddress || {
      address: customerAddress || "Dhaka, Bangladesh",
      city: "Dhaka",
      postalCode: "1200",
      area: "Gulshan",
    };

    // Standardize payment method
    let validPaymentMethod = paymentMethod || "Cash on Delivery";
    if (validPaymentMethod.toLowerCase().includes("card")) {
      validPaymentMethod = "Card or Debit Card";
    } else if (validPaymentMethod.toLowerCase().includes("bkash") || validPaymentMethod.toLowerCase().includes("nagad")) {
      validPaymentMethod = "Bkash";
    } else {
      validPaymentMethod = "Cash on Delivery";
    }

    // Standardize delivery method
    let validDeliveryMethod = deliveryMethod || "Standard";
    if (!["Saver", "Standard", "Priority"].includes(validDeliveryMethod)) {
      validDeliveryMethod = "Standard";
    }

    const formattedItems = orderItems.map((item: any) => ({
      product: item.product || item._id,
      name: item.name,
      quantity: item.quantity,
      image: item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop",
      price: item.price,
    }));

    const computedItemsPrice = itemsPrice ?? subtotal ?? 0;
    const computedShippingPrice =
      shippingPrice ?? (validDeliveryMethod === "Priority" ? 60 : 45);
    const computedTip = tipAmount ?? tip ?? 0;
    const computedTotal =
      totalPrice ?? total ?? (computedItemsPrice + computedShippingPrice + computedTip);

    // Create new order
    const order = await Order.create({
      user: session.user.id,
      orderItems: formattedItems,
      shippingAddress: addressObj,
      paymentMethod: validPaymentMethod,
      deliveryMethod: validDeliveryMethod,
      deliveryInstructions: deliveryInstructions || "",
      itemsPrice: computedItemsPrice,
      taxPrice: 0,
      shippingPrice: computedShippingPrice,
      tipAmount: computedTip,
      totalPrice: computedTotal,
      isPaid: validPaymentMethod !== "Cash on Delivery",
      paidAt: validPaymentMethod !== "Cash on Delivery" ? new Date() : undefined,
      status: "pending",
      estimatedDeliveryMinutes: validDeliveryMethod === "Priority" ? 25 : 35,
    });

    return NextResponse.json(
      {
        success: true,
        order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { message: error.message || "Error creating order" },
      { status: 500 }
    );
  }
}
