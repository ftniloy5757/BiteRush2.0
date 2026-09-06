// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import Order from "@/models/Order";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../auth/[...nextauth]/option";
import { DEMO_IDS } from "@/lib/demoData";
import { getDynamicOrders, addDynamicOrder } from "@/lib/dynamicOrdersStore";
import { CryptoService } from "@/lib/crypto/cryptoService";
import { KeyManager } from "@/lib/crypto/keyManager";

// Helper to decrypt order fields for permitted roles
function decryptOrderFields(orderObj: any, role?: string) {
  if (!orderObj) return orderObj;
  const o = typeof orderObj.toObject === "function" ? orderObj.toObject() : { ...orderObj };

  // Decrypt shipping address if ECC encrypted
  if (o.shippingAddressEncrypted) {
    try {
      const decryptedAddrJson = CryptoService.decryptOrderField(o.shippingAddressEncrypted);
      if (decryptedAddrJson.startsWith("{")) {
        o.shippingAddress = JSON.parse(decryptedAddrJson);
      }
    } catch (err) {
      console.warn("Failed decrypting order shipping address:", err);
    }
  }

  // Decrypt delivery instructions
  if (o.deliveryInstructionsEncrypted) {
    o.deliveryInstructions = CryptoService.decryptOrderField(o.deliveryInstructionsEncrypted);
  }

  // Decrypt review if present
  if (o.reviewEncrypted) {
    o.review = CryptoService.decryptReview(o.reviewEncrypted);
  }

  return o;
}

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
          const decryptedOrders = orders.map((ord) =>
            decryptOrderFields(ord, session.user.role)
          );
          return NextResponse.json({ orders: decryptedOrders }, { status: 200 });
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

    const calculatedItemsPrice =
      typeof itemsPrice === "number" && itemsPrice > 0
        ? itemsPrice
        : typeof body.subtotal === "number" && body.subtotal > 0
        ? body.subtotal
        : orderItems.reduce(
            (acc: number, item: any) =>
              acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
            0
          );

    const calculatedShippingPrice =
      typeof shippingPrice === "number"
        ? shippingPrice
        : typeof body.deliveryFee === "number"
        ? body.deliveryFee
        : 45;

    const calculatedTipAmount =
      typeof tipAmount === "number"
        ? tipAmount
        : typeof body.tip === "number"
        ? body.tip
        : 0;

    const calculatedTotalPrice =
      typeof totalPrice === "number" && totalPrice > 0
        ? totalPrice
        : typeof body.total === "number" && body.total > 0
        ? body.total
        : calculatedItemsPrice + calculatedShippingPrice + calculatedTipAmount;

    const normalizedOrderItems = orderItems.map((item: any) => ({
      ...item,
      product: item.product || item._id || item.id,
    }));

    // 1. Asymmetric ECC Encryption of sensitive delivery data
    const shippingAddressJson = JSON.stringify(shippingAddress);
    const shippingAddressEncrypted = CryptoService.encryptOrderField(shippingAddressJson);
    const deliveryInstructionsEncrypted = deliveryInstructions
      ? CryptoService.encryptOrderField(deliveryInstructions)
      : undefined;

    // 2. Data Integrity MAC
    const integrityMac = CryptoService.generateIntegrityMac({
      userId: session.user.id,
      totalPrice: calculatedTotalPrice,
      itemsPrice: calculatedItemsPrice,
      paymentMethod,
    });

    const dynamicCreated = addDynamicOrder({
      user: {
        _id: session.user.id || DEMO_IDS.CUSTOMER,
        firstName: session.user.firstName || "Niloy",
        lastName: session.user.lastName || "Farhan",
        email: session.user.email || "customer@biterush.com",
        contactNumber: session.user.contactNumber || "+8801700000001",
      },
      orderItems: normalizedOrderItems,
      shippingAddress,
      paymentMethod,
      deliveryMethod,
      deliveryInstructions,
      itemsPrice: calculatedItemsPrice,
      shippingPrice: calculatedShippingPrice,
      tipAmount: calculatedTipAmount,
      totalPrice: calculatedTotalPrice,
      status: "pending",
    });

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const order = new Order({
          user: session.user.id,
          orderItems: normalizedOrderItems,
          // Masked plaintext — actual data lives in shippingAddressEncrypted (ECC)
          shippingAddress: {
            address: "[ENCRYPTED]",
            city: "[ENCRYPTED]",
            postalCode: "[ENCRYPTED]",
            area: "[ENCRYPTED]",
          },
          shippingAddressEncrypted,
          paymentMethod,
          deliveryMethod,
          deliveryInstructions: deliveryInstructions ? "[ENCRYPTED]" : undefined,
          deliveryInstructionsEncrypted,
          itemsPrice: calculatedItemsPrice,
          shippingPrice: calculatedShippingPrice,
          tipAmount: calculatedTipAmount,
          totalPrice: calculatedTotalPrice,
          status: "pending",
          isPaid: paymentMethod === "Bkash" || paymentMethod === "Card or Debit Card",
          paidAt:
            paymentMethod === "Bkash" || paymentMethod === "Card or Debit Card"
              ? new Date()
              : undefined,
          cryptoVersion: KeyManager.getActiveVersion(),
          integrityMac,
        });

        const createdOrder = await order.save();
        const decryptedResponse = decryptOrderFields(createdOrder, session.user.role);
        return NextResponse.json({ order: decryptedResponse }, { status: 201 });
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
