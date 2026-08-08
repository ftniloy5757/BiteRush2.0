import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Product from "@/models/Product";
import Order from "@/models/Order";

export async function GET() {
  try {
    await connectDB();

    // Aggregate counts by product category
    const categories = ["burger", "pizza", "pasta", "dessert", "drink"];
    const productStats: Record<string, number> = {};

    for (const cat of categories) {
      const count = await Product.countDocuments({ category: cat });
      productStats[cat] = count;
    }

    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    return NextResponse.json({
      ...productStats,
      totalProducts,
      totalOrders,
    });
  } catch (error: any) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
