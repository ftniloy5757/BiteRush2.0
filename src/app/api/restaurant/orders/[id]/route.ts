import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import { DEMO_IDS } from "@/lib/demoData";
import { getDynamicOrderById, updateDynamicOrderStatus } from "@/lib/dynamicOrdersStore";
import { decryptOrderPayload } from "@/lib/crypto/orderDecryptor";

// PUT update order status (accept/decline/prepare/assign rider)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, riderId, estimatedDeliveryMinutes } = body;

    let newStatus = "pending";
    let extraFields: Record<string, any> = {};

    switch (action) {
      case "accept":
        newStatus = "accepted";
        extraFields.acceptedAt = new Date().toISOString();
        if (estimatedDeliveryMinutes) {
          extraFields.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
        }
        break;
      case "decline":
        newStatus = "declined";
        break;
      case "preparing":
        newStatus = "preparing";
        break;
      case "ready_for_pickup":
        newStatus = "ready_for_pickup";
        break;
      case "assign_rider":
        newStatus = "out_for_delivery";
        extraFields.dispatchedAt = new Date().toISOString();
        extraFields.rider = {
          _id: riderId || DEMO_IDS.RIDER,
          firstName: "Zayed",
          lastName: "Masum",
          contactNumber: "+8801700000003",
          vehicleType: "Motorcycle",
        };
        break;
      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    // Update dynamic store
    const dynamicUpdated = updateDynamicOrderStatus(id, newStatus, extraFields);

    const conn = await connectDB();
    if (conn) {
      try {
        const order = await Order.findById(id);
        if (order) {
          order.status = newStatus;
          if (extraFields.acceptedAt) order.acceptedAt = new Date(extraFields.acceptedAt);
          if (extraFields.estimatedDeliveryMinutes)
            order.estimatedDeliveryMinutes = extraFields.estimatedDeliveryMinutes;
          if (extraFields.dispatchedAt) order.dispatchedAt = new Date(extraFields.dispatchedAt);
          if (action === "assign_rider") order.rider = riderId || DEMO_IDS.RIDER;

          await order.save();

          const updated = await Order.findById(id)
            .populate("user", "firstName lastName email contactNumber firstNameEncrypted lastNameEncrypted emailEncrypted contactNumberEncrypted")
            .populate("rider", "firstName lastName contactNumber vehicleType firstNameEncrypted lastNameEncrypted contactNumberEncrypted vehicleTypeEncrypted");

          return NextResponse.json(decryptOrderPayload(updated), { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB update order error, using dynamic store:", dbErr);
      }
    }

    return NextResponse.json(decryptOrderPayload(dynamicUpdated) || { _id: id, status: newStatus }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json({ message: error.message || "Error updating order" }, { status: 500 });
  }
}
