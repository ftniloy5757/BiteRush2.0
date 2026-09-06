import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getDynamicProducts } from "@/lib/dynamicProductsStore";
import { FALLBACK_CATEGORY_IMAGES, isValidImage } from "@/components/customUi/DishImage";

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
                categoryCount[product.category] =
                  (categoryCount[product.category] || 0) + item.quantity;
              }
            }
          }

          const sortedCategories = Object.entries(categoryCount)
            .sort(([, a], [, b]) => b - a)
            .map(([cat]) => cat);

          if (sortedCategories.length > 0) {
            const preferredProducts = await Product.find({
              category: { $in: sortedCategories.slice(0, 3) },
              inStock: { $ne: false },
              isAvailable: { $ne: false },
            })
              .sort({ rating: -1 })
              .limit(6);

            const featuredProducts = await Product.find({
              inStock: { $ne: false },
              isAvailable: { $ne: false },
              _id: { $nin: preferredProducts.map((p) => p._id) },
            })
              .sort({ rating: -1, numReviews: -1 })
              .limit(6);

            const sanitizeList = (list: any[]) =>
              list.map((p) => {
                const obj = p.toObject ? p.toObject() : p;
                if (!isValidImage(obj.image)) {
                  obj.image =
                    FALLBACK_CATEGORY_IMAGES[obj.category] || FALLBACK_CATEGORY_IMAGES.default;
                }
                return obj;
              });

            return NextResponse.json(
              {
                personalized: sanitizeList(preferredProducts),
                trending: sanitizeList(featuredProducts),
                topCategories: sortedCategories.slice(0, 3),
              },
              { status: 200 }
            );
          }
        }

        const featured = await Product.find({ inStock: { $ne: false }, isAvailable: { $ne: false } })
          .sort({ featured: -1, rating: -1, createdAt: -1 })
          .limit(6);
        const popular = await Product.find({ inStock: { $ne: false }, isAvailable: { $ne: false } })
          .sort({ rating: -1, numReviews: -1, createdAt: -1 })
          .limit(6);

        const sanitizeList = (list: any[]) =>
          list.map((p) => {
            const obj = p.toObject ? p.toObject() : p;
            if (!isValidImage(obj.image)) {
              obj.image =
                FALLBACK_CATEGORY_IMAGES[obj.category] || FALLBACK_CATEGORY_IMAGES.default;
            }
            return obj;
          });

        if (featured.length > 0 || popular.length > 0) {
          return NextResponse.json(
            {
              personalized: sanitizeList(featured.slice(0, 3)),
              trending: sanitizeList(popular),
              topCategories: ["burger", "pizza", "pasta"],
            },
            { status: 200 }
          );
        }
      } catch (dbErr) {
        console.warn("DB query error in recommendations, serving dynamic fallback:", dbErr);
      }
    }

    // Dynamic recommendations from dynamic products
    const dynamicList = getDynamicProducts();
    const featured = dynamicList.filter((p) => p.featured);
    const personalized = (featured.length > 0 ? featured : dynamicList).slice(0, 3);
    const trending = dynamicList.slice(3, 9);

    return NextResponse.json(
      {
        personalized,
        trending: trending.length > 0 ? trending : dynamicList.slice(0, 6),
        topCategories: ["burger", "pizza", "pasta"],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching recommendations, serving fallback:", error);
    const dynamicList = getDynamicProducts();
    return NextResponse.json(
      {
        personalized: dynamicList.slice(0, 3),
        trending: dynamicList.slice(3, 9),
        topCategories: ["burger", "pizza", "pasta"],
      },
      { status: 200 }
    );
  }
}
