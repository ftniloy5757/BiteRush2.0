// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Order from "@/models/Order";
import Product from "@/models/Product";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../auth/[...nextauth]/option";

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
      address: customerAddress || "Standard Address",
      city: "Dhaka",
      postalCode: "1200",
      area: "Main City",
    };

    // Standardize payment method to model enum: ["Cash on Delivery", "Bkash", "Card or Debit Card"]
    let validPaymentMethod = paymentMethod || "Cash on Delivery";
    if (validPaymentMethod.toLowerCase().includes("card")) {
      validPaymentMethod = "Card or Debit Card";
    } else if (validPaymentMethod.toLowerCase().includes("bkash")) {
      validPaymentMethod = "Bkash";
    } else if (validPaymentMethod.toLowerCase().includes("nagad")) {
      validPaymentMethod = "Bkash"; // Map digital wallet
    } else {
      validPaymentMethod = "Cash on Delivery";
    }

    const formattedItems = orderItems.map((item: any) => ({
      product: item.product || item._id,
      name: item.name,
      quantity: item.quantity,
      image: item.image || "/food.jpg",
      price: item.price,
    }));

    const computedItemsPrice = itemsPrice ?? subtotal ?? 0;
    const computedShippingPrice =
      shippingPrice ?? (deliveryMethod === "Priority" ? 60 : 45);
    const computedTip = tipAmount ?? tip ?? 0;
    const computedTotal =
      totalPrice ?? total ?? computedItemsPrice + computedShippingPrice + computedTip;

    // Create new order
    const order = await Order.create({
      user: session.user.id,
      orderItems: formattedItems,
      shippingAddress: addressObj,
      paymentMethod: validPaymentMethod,
      deliveryMethod: deliveryMethod || "Standard",
      itemsPrice: computedItemsPrice,
      taxPrice: 0,
      shippingPrice: computedShippingPrice,
      tipAmount: computedTip,
      totalPrice: computedTotal,
      isPaid: validPaymentMethod !== "Cash on Delivery",
      paidAt: validPaymentMethod !== "Cash on Delivery" ? new Date() : undefined,
      status: "pending",
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
