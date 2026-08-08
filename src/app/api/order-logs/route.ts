import { NextResponse } from "next/server";
import OrderLog from "@/models/OrderLog";
import connectDB from "@/lib/dbConnect"; // Update to match the actual file name
 // assumes you have DB utility

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { userId, userName, actionType, orderId } = body;

    if (!userId || !userName || !actionType) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const newLog = await OrderLog.create({ userId, userName, actionType, orderId });
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error("Error logging order activity:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
