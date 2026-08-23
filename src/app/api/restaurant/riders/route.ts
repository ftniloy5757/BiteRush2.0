import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import User from "@/models/User";
import { DEMO_IDS } from "@/lib/demoData";

// GET available riders for restaurant dispatch
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectDB();
    if (conn) {
      try {
        let riders = await User.find({ role: "rider", activeStatus: true })
          .select("firstName lastName contactNumber vehicleType activeStatus");
        if (riders.length === 0) {
          try {
            const { seedDemoData } = await import("@/lib/seedDemoUsers");
            await seedDemoData();
            riders = await User.find({ role: "rider", activeStatus: true })
              .select("firstName lastName contactNumber vehicleType activeStatus");
          } catch {}
        }
        if (riders.length > 0) {
          return NextResponse.json(riders, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB riders lookup error, serving fallback:", dbErr);
      }
    }

    return NextResponse.json(
      [
        {
          _id: DEMO_IDS.RIDER,
          firstName: "Zayed",
          lastName: "Masum",
          contactNumber: "+8801700000003",
          vehicleType: "Motorcycle",
          activeStatus: true,
        },
      ],
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching riders:", error);
    return NextResponse.json(
      [
        {
          _id: DEMO_IDS.RIDER,
          firstName: "Zayed",
          lastName: "Masum",
          contactNumber: "+8801700000003",
          vehicleType: "Motorcycle",
          activeStatus: true,
        },
      ],
      { status: 200 }
    );
  }
}
