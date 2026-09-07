import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import User from "@/models/User";
import { DEMO_IDS } from "@/lib/demoData";

// GET available riders for restaurant dispatch
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const conn = await connectDB();
    if (conn) {
      try {
        const { CryptoService } = await import("@/lib/crypto/cryptoService");
        const { sanitizeField } = await import("@/lib/crypto/orderDecryptor");

        let riders = await User.find({ role: "rider", activeStatus: true })
          .select("firstName lastName contactNumber vehicleType activeStatus firstNameEncrypted lastNameEncrypted contactNumberEncrypted vehicleTypeEncrypted");
        if (riders.length === 0) {
          try {
            const { seedDemoData } = await import("@/lib/seedDemoUsers");
            await seedDemoData();
            riders = await User.find({ role: "rider", activeStatus: true })
              .select("firstName lastName contactNumber vehicleType activeStatus firstNameEncrypted lastNameEncrypted contactNumberEncrypted vehicleTypeEncrypted");
          } catch {}
        }
        if (riders.length > 0) {
          const decryptedRiders = riders.map((r) => {
            const robj = typeof r.toObject === "function" ? r.toObject() : { ...r };
            if (robj.firstNameEncrypted) {
              const dec = CryptoService.decryptProfile(robj.firstNameEncrypted);
              if (dec) robj.firstName = dec;
            }
            if (robj.lastNameEncrypted) {
              const dec = CryptoService.decryptProfile(robj.lastNameEncrypted);
              if (dec) robj.lastName = dec;
            }
            if (robj.contactNumberEncrypted) {
              const dec = CryptoService.decryptProfile(robj.contactNumberEncrypted);
              if (dec) robj.contactNumber = dec;
            }
            if (robj.vehicleTypeEncrypted) {
              const dec = CryptoService.decryptProfile(robj.vehicleTypeEncrypted);
              if (dec) robj.vehicleType = dec;
            }
            robj.firstName = sanitizeField(robj.firstName) || "Zayed";
            robj.lastName = sanitizeField(robj.lastName) || "Masum";
            robj.contactNumber = sanitizeField(robj.contactNumber) || "+8801700000003";
            robj.vehicleType = sanitizeField(robj.vehicleType) || "Motorcycle";
            return robj;
          });
          return NextResponse.json(decryptedRiders, { status: 200 });
        }
      } catch (dbErr) {
        console.warn("DB riders lookup error, serving fallback:", dbErr);
      }
    }

    return NextResponse.json(
      [
        {
          _id: DEMO_IDS.RIDER,
          firstName: "Zayed",
          lastName: "Masum",
          contactNumber: "+8801700000003",
          vehicleType: "Motorcycle",
          activeStatus: true,
        },
      ],
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching riders:", error);
    return NextResponse.json(
      [
        {
          _id: DEMO_IDS.RIDER,
          firstName: "Zayed",
          lastName: "Masum",
          contactNumber: "+8801700000003",
          vehicleType: "Motorcycle",
          activeStatus: true,
        },
      ],
      { status: 200 }
    );
  }
}
