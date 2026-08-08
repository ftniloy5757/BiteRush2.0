import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  if (!query.trim()) {
    return NextResponse.json({ users: [] });
  }

  try {
    await connectDB();

    // Create a regex search pattern for case-insensitive search
    const searchPattern = new RegExp(query, "i");

    const users = await User.find({
      $or: [{ firstName: searchPattern }, { lastName: searchPattern }],
    })
      .select("firstName lastName")
      .limit(10)
      .lean();

    // Format the results
    const formattedUsers = users.map((user) => ({
      id: (user as any)._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
