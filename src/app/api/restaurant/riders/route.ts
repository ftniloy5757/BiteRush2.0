import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import User from "@/models/User";

// GET available riders
export async function GET() {
  try {
    const conn = await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (conn) {
      let riders = await User.find({ role: "rider", activeStatus: true })
        .select("firstName lastName contactNumber vehicleType activeStatus");
      if (riders.length === 0) {
        const { seedDemoData } = await import("@/lib/seedDemoUsers");
        await seedDemoData();
        riders = await User.find({ role: "rider", activeStatus: true })
          .select("firstName lastName contactNumber vehicleType activeStatus");
      }
      return NextResponse.json(riders, { status: 200 });
    }
    return NextResponse.json([
      { _id: "rider_rahim_001", firstName: "Rahim", lastName: "Rider", contactNumber: "+8801700000003", vehicleType: "Motorcycle", activeStatus: true }
    ], { status: 200 });
  } catch (error) {
    console.error("Error fetching riders:", error);
    return NextResponse.json({ message: "Error fetching riders" }, { status: 500 });
  }
}
