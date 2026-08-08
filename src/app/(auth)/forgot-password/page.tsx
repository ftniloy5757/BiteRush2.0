// app/forgot-password/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/forgot-password", { email });
      setSuccess(true);
    } catch (error) {
      setError("An error occurred. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-[#fcf8f9] flex items-center justify-center p-4">
        <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-4">
            Check Your Email
          </h2>
          <p className="text-center mb-4">
            We&apos;ve sent a password reset link to your email. Please check
            your inbox and follow the instructions.
          </p>
          <Button
            onClick={() => router.push("/sign-in")}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Return to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br bg-[#fcf8f9] flex items-center justify-center p-4">
      <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="pl-10 block w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Reset Password <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
