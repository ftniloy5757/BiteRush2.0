import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Feedback from "@/models/Feedback";

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();
    const { name, comment, rating } = body;

    if (!name || !comment || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid input. All fields are required." },
        { status: 400 }
      );
    }

    const feedback = await Feedback.create({
      name,
      comment,
      rating,
    });

    return NextResponse.json({ message: "Feedback saved", feedback }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}
