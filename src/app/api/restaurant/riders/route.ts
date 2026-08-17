import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import User from "@/models/User";

// GET available riders
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const riders = await User.find({ role: "rider", activeStatus: true })
      .select("firstName lastName contactNumber vehicleType activeStatus");
    return NextResponse.json(riders, { status: 200 });
  } catch (error) {
    console.error("Error fetching riders:", error);
    return NextResponse.json({ message: "Error fetching riders" }, { status: 500 });
  }
}
