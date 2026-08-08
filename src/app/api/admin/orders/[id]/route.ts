// app/api/admin/orders/[id]/route.ts
import { NextResponse } from "next/server";

import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import connectDB from "@/lib/dbConnect";


export async function GET(
  request: Request,
  context: any
) {
  try {
    const params = await context.params;
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = params;
    
    await connectDB();
    
    const order = await Order.findById(id)
      .populate("user", "firstName lastName email");
    
    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { message: "Error fetching order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
 context: any
) {
  try {
    const params = await context.params;    
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = params;
    const data = await request.json();
    
    await connectDB();
    
    const order = await Order.findById(id);
    
    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }
    
    // Update order status
    if (data.status) {
      order.status = data.status;
      
      // If marking as delivered, also update isDelivered and deliveredAt
      if (data.status === "delivered" && !order.isDelivered) {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }
      
      await order.save();
    }
    
    const updatedOrder = await Order.findById(id)
      .populate("user", "firstName lastName email");
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { message: "Error updating order" },
      { status: 500 }
    );
  }
}