"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";

export default function Verify() {
  const params = useParams();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/verify-code", {
        userId: params.userId,
        emailOtp: otp,
      });

      if (res.data.success) {
        setMessage("Email verified successfully!");
        router.push("/sign-in"); // Changed to direct to onboarding after verification
      } else {
        setMessage(res.data.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("Verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-blue-600">
            Verify Your Email
          </CardTitle>
          <p className="text-center text-gray-600">
            We&apos;ve sent a verification code to your email
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Enter Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="pl-10"
                  placeholder="Enter 6-digit code"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              Verify Email
              <ArrowRight className="h-4 w-4" />
            </Button>

            {message && (
              <div
                className={`text-center ${
                  message.includes("success") || message.includes("sent")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </div>
            )}

            <div className="text-center text-sm text-gray-600">
              <p>Didn&apos;t receive the code?</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await axios.post("/api/send-otp", {
                      type: "email",
                      userId: params.userId,
                    });
                    setMessage("A new verification code has been sent!");
                  } catch {
                    setMessage("Sent a new verification code to your email.");
                  }
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Resend Code
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
