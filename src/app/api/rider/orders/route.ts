import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";

// GET assigned deliveries for rider
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "rider") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const orders = await Order.find({ rider: session.user.id })
      .populate("user", "firstName lastName email contactNumber")
      .sort({ createdAt: -1 });
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error fetching rider orders:", error);
    return NextResponse.json({ message: "Error fetching orders" }, { status: 500 });
  }
}
