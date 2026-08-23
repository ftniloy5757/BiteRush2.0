import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { getDynamicProducts } from "@/lib/dynamicProductsStore";
import { getDynamicOrders } from "@/lib/dynamicOrdersStore";

export async function GET() {
  try {
    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      try {
        const categories = ["burger", "pizza", "pasta", "dessert", "drink", "other"];
        const productStats: Record<string, number> = {};

        for (const cat of categories) {
          const count = await Product.countDocuments({ category: cat });
          productStats[cat] = count;
        }

        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        if (totalProducts > 0 || totalOrders > 0) {
          return NextResponse.json({
            ...productStats,
            totalProducts,
            totalOrders,
          });
        }
      } catch (dbErr) {
        console.warn("DB statistics error, computing from dynamic stores:", dbErr);
      }
    }

    // Dynamic stats computation
    const products = getDynamicProducts();
    const orders = getDynamicOrders();
    const categories = ["burger", "pizza", "pasta", "dessert", "drink", "other"];
    const productStats: Record<string, number> = {};

    for (const cat of categories) {
      productStats[cat] = products.filter((p) => p.category === cat).length;
    }

    return NextResponse.json({
      ...productStats,
      totalProducts: products.length,
      totalOrders: orders.length,
    });
  } catch (error: any) {
    console.error("Error fetching statistics:", error);
    const products = getDynamicProducts();
    const orders = getDynamicOrders();
    return NextResponse.json({
      totalProducts: products.length,
      totalOrders: orders.length,
    });
  }
}
