import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Product from "@/models/Product";

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
        try {
          const { seedDemoData } = await import("@/lib/seedDemoUsers");
          await seedDemoData();
          products = await Product.find().sort({ createdAt: -1 });
        } catch {}
      }

      const sanitizedProducts = products.map((p) => {
        const prodObj = p.toObject ? p.toObject() : p;
        if (!isValidImage(prodObj.image)) {
          prodObj.image =
            CATEGORY_DEFAULT_IMAGES[prodObj.category] || CATEGORY_DEFAULT_IMAGES.default;
        }
        return prodObj;
      });

      return NextResponse.json(sanitizedProducts, { status: 200 });
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
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const productData = await req.json();

    // Default image if none provided
    if (!isValidImage(productData.image)) {
      productData.image =
        CATEGORY_DEFAULT_IMAGES[productData.category] || CATEGORY_DEFAULT_IMAGES.default;
    }

    const conn = await connectDB();
    if (conn) {
      const newProduct = await Product.create(productData);
      return NextResponse.json(newProduct, { status: 201 });
    }

    const mockProduct = {
      _id: "prod_" + Date.now(),
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(mockProduct, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json({ message: error.message || "Error creating product" }, { status: 500 });
  }
}

// PUT update product
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updateData } = await req.json();

    if (updateData.image && !isValidImage(updateData.image)) {
      updateData.image =
        CATEGORY_DEFAULT_IMAGES[updateData.category] || CATEGORY_DEFAULT_IMAGES.default;
    }

    const conn = await connectDB();
    if (conn) {
      const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
      if (!product) {
        return NextResponse.json({ message: "Product not found" }, { status: 404 });
      }
      return NextResponse.json(product, { status: 200 });
    }

    return NextResponse.json({ _id: id, ...updateData }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json({ message: error.message || "Error updating product" }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "Product ID required" }, { status: 400 });
    }

    const conn = await connectDB();
    if (conn) {
      await Product.findByIdAndDelete(id);
    }
    return NextResponse.json({ message: "Product deleted", success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ message: error.message || "Error deleting product" }, { status: 500 });
  }
}
