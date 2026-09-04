// src/app/api/orders/[id]/rate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import Order from "@/models/Order";
import { getDynamicOrderById, addDynamicOrderRating } from "@/lib/dynamicOrdersStore";
import { CryptoService } from "@/lib/crypto/cryptoService";

// POST submit rating
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { rating, review } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Encrypt review text via Asymmetric ECC while keeping rating numeric plaintext
    const reviewEncrypted = review ? CryptoService.encryptReview(review.trim()) : undefined;

    // Update dynamic store
    addDynamicOrderRating(id, rating, review);

    const conn = await connectDB();
    if (conn) {
      try {
        const order = await Order.findById(id);
        if (order) {
          order.rating = rating;
          order.review = "[ENCRYPTED]";
          order.reviewEncrypted = reviewEncrypted;
          order.ratedAt = new Date();
          await order.save();
          return NextResponse.json({ success: true, order: { ...order.toObject(), review } }, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB save rating error, using dynamic store:", dbErr);
      }
    }

    const dynamicOrder = getDynamicOrderById(id);
    return NextResponse.json({ success: true, order: dynamicOrder }, { status: 200 });
  } catch (error: any) {
    console.error("Error rating order:", error);
    return NextResponse.json({ message: error.message || "Error rating order" }, { status: 500 });
  }
}
