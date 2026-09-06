"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams?.get("token") || "";

  useEffect(() => {
    if (!token && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const t = urlParams.get("token");
      if (!t) {
        router.push("/sign-in");
      }
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const activeToken = token || new URLSearchParams(window.location.search).get("token");
      if (!activeToken) throw new Error("Missing reset token");

      await axios.post("/api/reset-password", { token: activeToken, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired reset link. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center transition-all">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
          Password Reset Successful
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
          Your account password has been updated securely. You can now sign in using your new credentials.
        </p>
        <Button
          onClick={() => router.push("/sign-in")}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all"
        >
          Proceed to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 transition-all">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create a new strong password for your BiteRush account.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl">
          <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5"
          >
            New Password
          </label>
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="pl-10 block w-full bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Confirm New Password
          </label>
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="pl-10 block w-full bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {loading ? "Updating password..." : (
            <span className="flex items-center justify-center">
              Update Password <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          )}
        </Button>

        <div className="text-center pt-2">
          <Link
            href="/sign-in"
            className="inline-flex items-center text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-8 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
      <div className="animate-pulse space-y-4">
        <div className="h-14 w-14 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4 mx-auto"></div>
        <div className="space-y-3 pt-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl mt-4"></div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-orange-50/50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-200">
      <Suspense fallback={<LoadingState />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
