import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../auth/[...nextauth]/option";
import Product from "@/models/Product";
import { INITIAL_PRODUCTS } from "@/lib/initialProducts";

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

      if (products.length === 0 && (!category || category === "all")) {
        const { seedDemoData } = await import("@/lib/seedDemoUsers");
        await seedDemoData();
        products = await Product.find(filter).sort({ createdAt: -1 });
      }

      if (products.length > 0) {
        return NextResponse.json(products, { status: 200 });
      }
    }

    // Resilient Fallback in case DB is unconfigured or initializing
    let fallback = [...INITIAL_PRODUCTS];
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
    return NextResponse.json(INITIAL_PRODUCTS, { status: 200 });
  }
}

// POST create new product (restaurant or admin)
export async function POST(req: NextRequest) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ message: "Database connection unavailable" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const productData = await req.json();
    const newProduct = await Product.create(productData);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { message: error.message || "Error creating product" },
      { status: 500 }
    );
  }
}