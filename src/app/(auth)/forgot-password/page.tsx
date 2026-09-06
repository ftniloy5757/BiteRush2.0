// app/forgot-password/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-orange-50/50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-200">
        <div className="p-8 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center transition-all">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            Check Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{email}</span>.
            Please check your inbox (and spam folder) and click the link to reset your password.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/sign-in")}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all"
            >
              Return to Sign In
            </Button>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium"
            >
              Didn&apos;t receive it? Try another email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="p-8 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 transition-all">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <KeyRound className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Forgot Password?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            No worries, enter your account email and we&apos;ll send you a secure reset link.
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
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="pl-10 block w-full bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {loading ? "Sending link..." : (
              <span className="flex items-center justify-center">
                Send Reset Link <ArrowRight className="ml-2 h-4 w-4" />
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
    </div>
  );
}
