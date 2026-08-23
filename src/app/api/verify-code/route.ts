// src/app/api/verify-code/route.ts
import User from "@/models/User";
import connectDB from "@/lib/dbConnect";
import { CryptoService } from "@/lib/crypto/cryptoService";

export const POST = async (request: Request) => {
  const { userId, emailOtp, code } = await request.json();
  const inputCode = (code || emailOtp || "").trim();

  try {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { status: 404 }
      );
    }

    // Verify OTP using CryptoService
    const storedOtp = user.emailOtp || user.twoFactorOtp;
    const expiresAt = user.emailOtpExpiresAt || user.twoFactorOtpExpiresAt;

    const isValid = CryptoService.verifyOTP(inputCode, storedOtp, expiresAt);

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid or expired verification code" }),
        { status: 400 }
      );
    }

    // Mark verified
    user.isEmailVerified = true;
    user.isTwoFactorVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiresAt = undefined;
    user.twoFactorOtp = undefined;
    user.twoFactorOtpExpiresAt = undefined;
    await user.save();

    return new Response(
      JSON.stringify({ success: true, message: "2FA Verification successful" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("2FA verification error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Verification failed" }),
      { status: 500 }
    );
  }
};
