// app/api/admin/orders/[id]/pay/route.ts
import { NextResponse } from "next/server";

import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import connectDB from "@/lib/dbConnect";


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
    
    await connectDB();
    
    const order = await Order.findById(id);
    
    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }
    
    // Mark order as paid
    order.isPaid = true;
    order.paidAt = new Date();
    
    await order.save();
    
    const updatedOrder = await Order.findById(id)
      .populate("user", "firstName lastName email");
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error marking order as paid:", error);
    return NextResponse.json(
      { message: "Error marking order as paid" },
      { status: 500 }
    );
  }
}