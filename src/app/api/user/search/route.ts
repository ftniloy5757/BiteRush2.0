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

    const candidates = await User.find({})
      .select("firstName lastName firstNameEncrypted lastNameEncrypted email emailEncrypted")
      .limit(50)
      .lean();

    const { decryptUserPayload } = await import("@/lib/crypto/orderDecryptor");
    const qLower = query.toLowerCase().trim();

    const formattedUsers = candidates
      .map((u) => decryptUserPayload(u))
      .filter((u) => {
        const full = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        return full.includes(qLower) || email.includes(qLower);
      })
      .slice(0, 10)
      .map((u) => ({
        id: (u._id || u.id).toString(),
        firstName: u.firstName,
        lastName: u.lastName,
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
