// /app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import Product from "@/models/Product";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/option";

// GET single product by ID
export async function GET(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    await connectDB();

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { message: "Error fetching product" },
      { status: 500 }
    );
  }
}

// PUT update product (admin only)
export async function PUT(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    await connectDB();

    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const productData = await req.json();

    const updatedProduct = await Product.findByIdAndUpdate(id, productData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: error.message || "Error updating product" },
      { status: 500 }
    );
  }
}

// DELETE product (admin only)
export async function DELETE(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    await connectDB();

    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { message: "Error deleting product" },
      { status: 500 }
    );
  }
}