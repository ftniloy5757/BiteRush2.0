import User from "@/models/User"; // Using your Mongoose User model
import connectDB from "@/lib/dbConnect";

export const POST = async (request: Request) => {
  const { userId, emailOtp } = await request.json();

  try {
    // Connect to the database
    await connectDB();

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { status: 404 }
      );
    }

    // Check if OTP is valid and not expired
    if (
      user.emailOtp !== emailOtp ||
      (user.emailOtpExpiresAt && new Date(user.emailOtpExpiresAt) < new Date())
    ) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid or expired OTP" }),
        { status: 400 }
      );
    }

    // Update user to mark email as verified and clear OTP fields
    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiresAt = undefined;
    await user.save();

    return new Response(
      JSON.stringify({ success: true, message: "Email verified successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Verification failed" }),
      { status: 500 }
    );
  }
};
