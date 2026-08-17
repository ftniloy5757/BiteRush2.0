import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Product from "@/models/Product";

// GET all products for restaurant management
export async function GET() {
  try {
    const conn = await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (conn) {
      let products = await Product.find().sort({ createdAt: -1 });
      if (products.length === 0) {
        const { seedDemoData } = await import("@/lib/seedDemoUsers");
        await seedDemoData();
        products = await Product.find().sort({ createdAt: -1 });
      }
      return NextResponse.json(products, { status: 200 });
    }

    const { INITIAL_PRODUCTS } = await import("@/lib/initialProducts");
    return NextResponse.json(INITIAL_PRODUCTS, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    const { INITIAL_PRODUCTS } = await import("@/lib/initialProducts");
    return NextResponse.json(INITIAL_PRODUCTS, { status: 200 });
  }
}

// POST create new product
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const productData = await req.json();
    const newProduct = await Product.create(productData);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json({ message: error.message || "Error creating product" }, { status: 500 });
  }
}

// PUT update product
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id, ...updateData } = await req.json();
    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product, { status: 200 });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json({ message: error.message || "Error updating product" }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "Product ID required" }, { status: 400 });
    }
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ message: error.message || "Error deleting product" }, { status: 500 });
  }
}
