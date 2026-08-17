import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";

// POST submit rating
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { rating, review } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.user.toString() !== session.user.id) {
      return NextResponse.json({ message: "Not your order" }, { status: 403 });
    }

    if (order.status !== "delivered") {
      return NextResponse.json({ message: "Can only rate delivered orders" }, { status: 400 });
    }

    if (order.rating) {
      return NextResponse.json({ message: "Order already rated" }, { status: 400 });
    }

    order.rating = rating;
    order.review = review || "";
    order.ratedAt = new Date();
    await order.save();

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error: any) {
    console.error("Error rating order:", error);
    return NextResponse.json({ message: error.message || "Error rating order" }, { status: 500 });
  }
}
