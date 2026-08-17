import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import Product from "@/models/Product";

// GET personalized recommendations for customer
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    let recommendations;

    if (session?.user?.id) {
      // Get user's order history
      const userOrders = await Order.find({ user: session.user.id, status: "delivered" });

      // Count category preferences from past orders
      const categoryCount: Record<string, number> = {};
      for (const order of userOrders) {
        for (const item of order.orderItems) {
          // Look up product to get category
          const product = await Product.findById(item.product);
          if (product) {
            categoryCount[product.category] = (categoryCount[product.category] || 0) + item.quantity;
          }
        }
      }

      // Sort categories by frequency
      const sortedCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .map(([cat]) => cat);

      if (sortedCategories.length > 0) {
        // Get products from most-ordered categories first, then fill with featured/popular
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

        recommendations = {
          personalized: preferredProducts,
          trending: featuredProducts,
          topCategories: sortedCategories.slice(0, 3),
        };
      } else {
        // No order history — show featured and popular
        const featured = await Product.find({ featured: true, isAvailable: true, inStock: true }).limit(6);
        const popular = await Product.find({ isAvailable: true, inStock: true }).sort({ rating: -1, numReviews: -1 }).limit(6);

        recommendations = {
          personalized: [],
          trending: featured.length > 0 ? featured : popular,
          topCategories: [],
        };
      }
    } else {
      // Not logged in — show popular items
      const popular = await Product.find({ isAvailable: true, inStock: true }).sort({ rating: -1, numReviews: -1 }).limit(8);
      recommendations = {
        personalized: [],
        trending: popular,
        topCategories: [],
      };
    }

    return NextResponse.json(recommendations, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ message: error.message || "Error fetching recommendations" }, { status: 500 });
  }
}
