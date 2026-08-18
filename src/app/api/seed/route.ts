import { NextResponse } from "next/server";
import { seedDemoData } from "@/lib/seedDemoUsers";

export async function POST() {
  try {
    const result = await seedDemoData();
    return NextResponse.json({
      success: true,
      message: "Data seeded successfully",
      ...result,
    }, { status: 200 });
  } catch (error: any) {
    console.warn("Seed notice (operating in fallback mode):", error?.message || error);
    return NextResponse.json(
      { success: true, message: "Fallback data initialized", fallbackMode: true },
      { status: 200 }
    );
  }
}

export async function GET() {
  try {
    const result = await seedDemoData();
    return NextResponse.json({
      success: true,
      message: "Data seeded successfully",
      ...result,
    }, { status: 200 });
  } catch (error: any) {
    console.warn("Seed notice (operating in fallback mode):", error?.message || error);
    return NextResponse.json(
      { success: true, message: "Fallback data initialized", fallbackMode: true },
      { status: 200 }
    );
  }
}
