import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../auth/[...nextauth]/option";
import Product from "@/models/Product";
import { getDynamicProducts, addDynamicProduct } from "@/lib/dynamicProductsStore";

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop",
  pizza: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=450&fit=crop",
  pasta: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=450&fit=crop",
  dessert: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=450&fit=crop",
  drink: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=450&fit=crop",
  other: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
  default: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
};

const isValidImage = (img?: string) => {
  if (!img) return false;
  return img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:image/");
};

// GET all products with optional filtering (with guaranteed fallback)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");

    const conn = await connectDB();

    if (conn) {
      // Build filter object
      const filter: any = {};
      if (category && category !== "all") filter.category = category;
      if (featured === "true") filter.featured = true;
      if (minPrice) filter.price = { $gte: parseFloat(minPrice) };
      if (maxPrice) {
        filter.price = { ...(filter.price || {}), $lte: parseFloat(maxPrice) };
      }
      if (minRating) filter.rating = { $gte: parseFloat(minRating) };

      let products = await Product.find(filter).sort({ createdAt: -1 });

      // Seed only if collection is completely empty
      if (products.length === 0 && (!category || category === "all")) {
        try {
          const { seedDemoData } = await import("@/lib/seedDemoUsers");
          await seedDemoData();
          products = await Product.find(filter).sort({ createdAt: -1 });
        } catch {}
      }

      if (products.length > 0) {
        // Guarantee all items have working images (support both URL and base64)
        const sanitizedProducts = products.map((p) => {
          const prodObj = p.toObject ? p.toObject() : p;
          if (!isValidImage(prodObj.image)) {
            prodObj.image =
              CATEGORY_DEFAULT_IMAGES[prodObj.category] || CATEGORY_DEFAULT_IMAGES.default;
          }
          return prodObj;
        });

        // Merge any initial products not already present in the DB results
        const { INITIAL_PRODUCTS } = await import("@/lib/initialProducts");
        for (const ip of INITIAL_PRODUCTS) {
          const exists = sanitizedProducts.some(
            (sp) => sp.name?.toLowerCase().trim() === ip.name.toLowerCase().trim()
          );
          if (!exists) {
            let match = true;
            if (category && category !== "all" && ip.category.toLowerCase() !== category.toLowerCase()) match = false;
            if (featured === "true" && !ip.featured) match = false;
            if (minPrice && ip.price < parseFloat(minPrice)) match = false;
            if (maxPrice && ip.price > parseFloat(maxPrice)) match = false;
            if (minRating && ip.rating < parseFloat(minRating)) match = false;
            if (match) {
              sanitizedProducts.push(ip);
            }
          }
        }

        return NextResponse.json(sanitizedProducts, { status: 200 });
      }
    }

    // Dynamic Store Fallback
    let fallback = getDynamicProducts();
    if (category && category !== "all") {
      fallback = fallback.filter((p) => p.category === category);
    }
    if (featured === "true") {
      fallback = fallback.filter((p) => p.featured);
    }
    if (minPrice) {
      fallback = fallback.filter((p) => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      fallback = fallback.filter((p) => p.price <= parseFloat(maxPrice));
    }
    if (minRating) {
      fallback = fallback.filter((p) => p.rating >= parseFloat(minRating));
    }

    return NextResponse.json(fallback, { status: 200 });
  } catch (error) {
    console.error("Products API error, serving fallback:", error);
    return NextResponse.json(getDynamicProducts(), { status: 200 });
  }
}

// POST create new product (restaurant or admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const productData = await req.json();

    // Default image if none supplied
    if (!isValidImage(productData.image)) {
      productData.image =
        CATEGORY_DEFAULT_IMAGES[productData.category] || CATEGORY_DEFAULT_IMAGES.default;
    }

    const dynamicCreated = addDynamicProduct(productData);

    const conn = await connectDB();
    if (conn) {
      try {
        const newProduct = await Product.create(productData);
        return NextResponse.json(newProduct, { status: 201 });
      } catch (dbErr) {
        console.warn("DB save failed, using dynamic created:", dbErr);
      }
    }

    return NextResponse.json(dynamicCreated, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { message: error.message || "Error creating product" },
      { status: 500 }
    );
  }
}