"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

// Separate component for the form content
function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams?.get("token");
    if (!token) {
      router.push("/sign-in");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const token = searchParams.get("token");
      if (!token) throw new Error("Invalid token");

      await axios.post("/api/reset-password", { token, password });
      setSuccess(true);
    } catch (error) {
      setError("An error occurred. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">
          Password Reset Successful
        </h2>
        <p className="text-center mb-4">
          Your password has been successfully reset. You can now sign in with
          your new password.
        </p>
        <Button
          onClick={() => router.push("/signin")}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
        >
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            New Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="pl-10 block w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm New Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="pl-10 block w-full"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
  );
}

// Loading component
function LoadingState() {
  return (
    <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-md">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ResetPassword() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br bg-[#fcf8f9] flex items-center justify-center p-4">
      <Suspense fallback={<LoadingState />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
