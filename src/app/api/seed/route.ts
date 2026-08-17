import { NextResponse } from "next/server";
import { seedDemoData } from "@/lib/seedDemoUsers";

export async function POST() {
  try {
    const result = await seedDemoData();
    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to seed data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await seedDemoData();
    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to seed data" },
      { status: 500 }
    );
  }
}
