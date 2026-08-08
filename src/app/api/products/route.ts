// /app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";


import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../auth/[...nextauth]/option";
import Product from "@/models/Product";

// GET all products with optional filtering
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");

    // Build filter object
    const filter: any = {};

    if (category) filter.category = category;
    if (featured === "true") filter.featured = true;
    if (minPrice) filter.price = { $gte: parseFloat(minPrice) };
    if (maxPrice) {
      filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
    }
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Error fetching products" },
      { status: 500 }
    );
  }
}

// POST create new product (admin only)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
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