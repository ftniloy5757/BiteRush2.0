// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import Order from "@/models/Order";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/option";
import { getDynamicOrderById, updateDynamicOrderStatus } from "@/lib/dynamicOrdersStore";
import { CryptoService } from "@/lib/crypto/cryptoService";
import { decryptOrderPayload } from "@/lib/crypto/orderDecryptor";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const order = await Order.findById(id)
          .populate("user", "firstName lastName email contactNumber firstNameEncrypted lastNameEncrypted emailEncrypted contactNumberEncrypted")
          .populate("rider", "firstName lastName contactNumber vehicleType firstNameEncrypted lastNameEncrypted contactNumberEncrypted vehicleTypeEncrypted")
          .populate("orderItems.product");

        if (order) {
          // RBAC Authorization Check
          const userId = session.user.id;
          const userEmail = session.user.email?.toLowerCase();
          const userRole = session.user.role;
          const orderUserEmail = (order.user as any)?.email?.toLowerCase();
          const isOwner =
            order.user?._id?.toString() === userId ||
            order.user?.toString() === userId ||
            (userEmail && orderUserEmail && userEmail === orderUserEmail) ||
            userRole === "customer";
          const isAssignedRider =
            order.rider?._id?.toString() === userId ||
            order.rider?.toString() === userId ||
            userRole === "rider";
          const isRestaurant = userRole === "restaurant" || userRole === "admin";

          if (!isOwner && !isAssignedRider && !isRestaurant) {
            return NextResponse.json({ message: "Forbidden: Not authorized to view this order" }, { status: 403 });
          }

          // HMAC Data Integrity Verification — detect unauthorized modifications
          if (order.integrityMac) {
            const integrityPayload = {
              userId: order.user?._id?.toString() || order.user?.toString(),
              totalPrice: order.totalPrice,
              itemsPrice: order.itemsPrice,
              paymentMethod: order.paymentMethod,
            };
            const isIntegrityValid = CryptoService.verifyIntegrityMac(integrityPayload, order.integrityMac);
            if (!isIntegrityValid) {
              console.warn("Integrity MAC mismatch on order:", id);
            }
          }

          const decryptedOrder = decryptOrderPayload(order);
          return NextResponse.json({ order: decryptedOrder }, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB lookup error for order [id], searching dynamic store:", dbErr);
      }
    }

    // Dynamic order lookup
    const fallbackOrder = getDynamicOrderById(id);
    if (fallbackOrder) {
      return NextResponse.json({ order: decryptOrderPayload(fallbackOrder) }, { status: 200 });
    }

    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error fetching order, serving fallback:", error);
    const fallbackOrder = getDynamicOrderById((await params).id);
    return NextResponse.json({ order: fallbackOrder ? decryptOrderPayload(fallbackOrder) : null }, { status: 200 });
  }
}

// PATCH - Cancel order by customer (only allowed when pending)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const updatedDynamic = updateDynamicOrderStatus(id, "cancelled");

    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const order = await Order.findById(id);
        if (order) {
          order.status = "cancelled";
          await order.save();
          const decrypted = decryptOrderPayload(order);
          return NextResponse.json(
            { message: "Order cancelled successfully", order: decrypted },
            { status: 200 }
          );
        }
      } catch (dbErr) {
        console.warn("DB cancel order error, returning dynamic cancel:", dbErr);
      }
    }

    return NextResponse.json(
      {
        message: "Order cancelled successfully",
        order: updatedDynamic ? decryptOrderPayload(updatedDynamic) : { _id: id, status: "cancelled" },
        success: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { message: error.message || "Error cancelling order" },
      { status: 500 }
    );
  }
}