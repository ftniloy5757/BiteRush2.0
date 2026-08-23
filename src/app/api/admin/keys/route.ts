// src/app/api/admin/keys/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import { KeyManager, formatRSAPublicKey, formatECCPublicKey } from "@/lib/crypto/keyManager";

// GET - Key Distribution & Status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const activeVersion = KeyManager.getActiveVersion();
    const ring = KeyManager.getKeyRing(activeVersion);

    return NextResponse.json({
      activeVersion,
      algorithms: {
        profileAsymmetric: "RSA-1024-PKCS1",
        ordersAsymmetric: "ECC-SECP256K1-ELGAMAL",
        integrityHash: "HMAC-SHA256",
        otpEngine: "HMAC-SHA256-DYNAMIC-TRUNCATION",
      },
      publicKeys: {
        rsaPublicKey: formatRSAPublicKey(ring.rsaPublicKey),
        eccPublicKey: formatECCPublicKey(ring.eccPublicKey),
      },
      status: "Operational",
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Key management error" }, { status: 500 });
  }
}

// POST - Rotate Cryptographic Keys
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const rotationResult = KeyManager.rotateKeys();

    return NextResponse.json({
      message: "Keys rotated successfully",
      rotation: rotationResult,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Key rotation failed" }, { status: 500 });
  }
}
