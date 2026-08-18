import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { INITIAL_PRODUCTS } from "@/lib/initialProducts";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const conn = await connectDB();

    if (conn && mongoose.connection.readyState === 1) {
      try {
        if (session?.user?.id) {
          const userOrders = await Order.find({ user: session.user.id, status: "delivered" });

          const categoryCount: Record<string, number> = {};
          for (const order of userOrders) {
            for (const item of order.orderItems) {
              const product = await Product.findById(item.product);
              if (product) {
                categoryCount[product.category] = (categoryCount[product.category] || 0) + item.quantity;
              }
            }
          }

          const sortedCategories = Object.entries(categoryCount)
            .sort(([, a], [, b]) => b - a)
            .map(([cat]) => cat);

          if (sortedCategories.length > 0) {
            const preferredProducts = await Product.find({
              category: { $in: sortedCategories.slice(0, 3) },
              isAvailable: true,
              inStock: true,
            }).sort({ rating: -1 }).limit(6);

            const featuredProducts = await Product.find({
              isAvailable: true,
              inStock: true,
              _id: { $nin: preferredProducts.map((p) => p._id) },
            }).sort({ rating: -1, numReviews: -1 }).limit(6);

            return NextResponse.json({
              personalized: preferredProducts,
              trending: featuredProducts,
              topCategories: sortedCategories.slice(0, 3),
            }, { status: 200 });
          }
        }

        const featured = await Product.find({ featured: true, isAvailable: true, inStock: true }).limit(6);
        const popular = await Product.find({ isAvailable: true, inStock: true }).sort({ rating: -1, numReviews: -1 }).limit(6);

        return NextResponse.json({
          personalized: featured.slice(0, 3),
          trending: popular,
          topCategories: ["burger", "pizza", "pasta"],
        }, { status: 200 });
      } catch (dbErr) {
        console.warn("DB query error in recommendations, serving fallback:", dbErr);
      }
    }

    // Fallback recommendations using initial products
    return NextResponse.json({
      personalized: INITIAL_PRODUCTS.slice(0, 3),
      trending: INITIAL_PRODUCTS.slice(3),
      topCategories: ["burger", "pizza", "pasta"],
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching recommendations, serving fallback:", error);
    return NextResponse.json({
      personalized: INITIAL_PRODUCTS.slice(0, 3),
      trending: INITIAL_PRODUCTS.slice(3),
      topCategories: ["burger", "pizza"],
    }, { status: 200 });
  }
}
